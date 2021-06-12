import { Injectable } from "@nestjs/common";
import { web3Socket } from "../utils/constants";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  DROP_CONTRACT_ABI,
  CONTRACT_ADDRESS,
  constants,
} from "../utils/constants";
import { EventHandlerService } from "./eventHandlers/dropzeroEventsHandler.service";
import { DropZeroBlock } from "../dropper/dropZeroBlock.model";

const dropZeroContract = new web3Socket.eth.Contract(
  DROP_CONTRACT_ABI,
  CONTRACT_ADDRESS
);

@Injectable()
export class EventService {
  constructor(
    private readonly eventHandlerService: EventHandlerService,
    @InjectModel("DropZeroBlock")
    private readonly dropZeroBlockModel: Model<DropZeroBlock>
  ) {
    this.InitialzedWeb3Socket();
    this.syncGraph();
  }

  async InitialzedWeb3Socket() {
    this.refreshProvider(
      web3Socket,
      `wss://${process.env.NETWORK}.infura.io/ws/v3/88886c15abf644e08e42898d6736fec1`
    );
  }

  async refreshProvider(web3Obj, providerUrl) {
    let retries = 0;

    function retry(event) {
      if (event) {
        console.log(
          "Web3 provider disconnected or errored.",
          " -> Timestamp -> ",
          Date().toString()
        );
        retries += 1;

        if (retries > 5) {
          console.log(
            `Max retries of 5 exceeding: ${retries} times tried`,
            " -> Timestamp -> ",
            Date().toString()
          );
          return setTimeout(this.refreshProvider, 5000);
        }
      } else {
        this.refreshProvider(web3Obj, providerUrl);
      }

      return null;
    }

    const provider = new web3Socket.providers.WebsocketProvider(providerUrl, {
      timeout: 30000,
      clientConfig: {
        maxReceivedFrameSize: 100000000,
        maxReceivedMessageSize: 100000000,
        keepalive: true,
        keepaliveInterval: 60000,
      },
      reconnect: {
        auto: true,
        delay: 5000,
        maxAttempts: 10,
        onTimeout: false,
      },
    });

    provider.on("end", retry);
    provider.on("error", retry);

    web3Obj.setProvider(provider);

    console.log(
      "New Web3 provider initiated",
      " -> Timestamp -> ",
      Date().toString()
    );

    return provider;
  }

  async subscribeToContractEvents(block, contract, _contractAddress) {
    try {
      return contract.events
        .allEvents({
          fromBlock: block,
        })
        .on("data", (_event) => {
          try {
            this.eventHandlerService.eventHandle(_event);
          } catch (e) {
            console.log("check error", e);
          }
        })
        .on("error", (e) => {
          console.log("check error", e);
        });
    } catch (e) {
      console.log("check error", e);
    }
  }

  async syncGraph() {
    try {
      let _currentBlockNumber = await web3Socket.eth.getBlockNumber();
      let check = await this.dropZeroBlockModel.findOneAndUpdate({
        currentBlockNumber: _currentBlockNumber,
      });
      if (check == null) {
        await this.dropZeroBlockModel.create({
          currentBlockNumber: _currentBlockNumber,
        });
      }
      console.log("_current block number", _currentBlockNumber);
      await this.subscribeToContractEvents(
        constants.FROM_BLOCK,
        dropZeroContract,
        CONTRACT_ADDRESS
      );
    } catch (error) {
      console.log("check error now", error);
      throw error;
    }
  }
}

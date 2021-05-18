import MerkleTree from "./merkle-tree";
import { BigNumber, utils } from "ethers";

export default class BalanceTree {
  private readonly tree: MerkleTree;
  public decimal: number;
  constructor(balances: any, decimal) {
    this.decimal = decimal;
    this.tree = new MerkleTree(
      balances.map(({ address, amount }, index) => {
        return this.toNode(index, address, amount);
      })
    );
  }

  public verifyProof(
    index: number | BigNumber,
    account: string,
    amount: BigNumber,
    proof: Buffer[],
    root: Buffer
  ): boolean {
    let pair = this.toNode(index, account, amount);
    for (const item of proof) {
      pair = MerkleTree.combinedHash(pair, item);
    }

    return pair.equals(root);
  }

  public toNode(
    index: number | BigNumber,
    address: string,
    amount: BigNumber
  ): Buffer {
    return Buffer.from(
      utils
        .solidityKeccak256(
          ["uint256", "address", "uint256"],
          [index, address, utils.parseUnits(String(amount), this.decimal)]
        )
        .substr(2),
      "hex"
    );
  }

  public getHexRoot(): string {
    return this.tree.getHexRoot();
  }

  public getProof(
    index: number | BigNumber,
    account: string,
    amount: BigNumber
  ): string[] {
    return this.tree.getHexProof(this.toNode(index, account, amount));
  }
}

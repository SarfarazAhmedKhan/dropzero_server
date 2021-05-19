import { auth } from "firebase-admin";
import { extname } from "path";
const Git = require("nodegit");
const path = require("path");
const fileContent = "hello world";
const fileName = "hello.txt";
const directoryName = "projects/debugger/dropzero_server";
const { Parser } = require("json2csv");
const json2csvParser = new Parser();
const fs = require("fs");
const fse = require("fs-extra");
const simpleGit = require("simple-git");
const git = simpleGit();

// Shelljs package for running shell tasks optional
const shellJs = require("shelljs");
// Simple Git with Promise for handling success and failure
const simpleGitPromise = require("simple-git/promise")();
shellJs.cd("./");
const repo = "dropzero_server"; //Repo name
// User name and password of your GitHub
const userName = "sarfarazahmedkhan";
const password = process.env.password;
const gitHubUrl = `https://${userName}:${password}@github.com/${userName}/${repo}`;
git.addConfig("user.email", "sarfarazahmedkhankhan@gmail.com");
git.addConfig("user.name", "sarfarazahmedkhan");

export const editFileName = (req, file, callback) => {
  try {
    const name = file.originalname.split(".")[0];
    const fileExtName = extname(file.originalname);
    const randomName = Array(4)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join("");
    callback(null, `${name}-${randomName}${fileExtName}`);
  } catch (error) {
    console.log("error", error);
  }
};

export const editCsvFileName = (file) => {
  try {
    const name = file;
    const randomName = Array(4)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join("");
    return randomName;
  } catch (error) {
    console.log("error", error);
  }
};

export const imageFileFilter = (res, file, callback) => {
  try {
    if (!file.originalname.match(/\.(csv)$/)) {
      return callback(new Error("Only csv files are allowed!"), false);
    }
    callback(null, true);
  } catch (error) {
    console.log("error==>", error);
  }
};

export const convertJsonToCsv = (data, token_name, date, id) => {
  try {
    let csv = JSON.parse(data);
    let filename =
      `${token_name + "(" + date + ")"}` + "_" + editCsvFileName(id);
    console.log("check filename now", filename);
    let refactor_data = csv.map(({ address, amount, status }, index) => ({
      index,
      address,
      amount,
      status,
    }));
    const csv_data = json2csvParser.parse(refactor_data);
    fs.writeFile(`${filename}.csv`, csv_data, "utf8", function(err) {
      if (err) {
        console.log(
          "Some error occured - file either not saved or corrupted file saved.",
          err
        );
      } else {
        console.log("It's saved!");
      }
    });
    return `${filename}.csv`;
  } catch (error) {
    console.log("error==>", error);
  }
};

export const gitUpload = async () => {
  let index;
  Git.Repository.open("./")
    .then(function(repo) {
      let repository = repo;
      console.log("check index", repo.refreshIndex());
    })
    .then(function(idx) {
      index = idx;
      console.log(index.addByPath(fileName));
      return index.addByPath(fileName);
    });
  // .then(function() {
  //   return index.writeTree();
  // })
  // .then(function(oid) {
  //   return repository.createCommit(
  //     "HEAD",
  //     Git.Signature.default(repository),
  //     Git.Signature.default(repository),
  //     "message",
  //     oid,
  //     []
  //   );
  // });

  // const repo = await Git.Repository.open("./");
  // const index = await repo.refreshIndex();
  // await fs.promises.mkdir(path.join(repo.workdir(), "./"), {
  //   recursive: true,
  // });

  // await fs.promises.writeFile(path.join(repo.workdir(), fileName), fileContent);
  // await fs.promises.writeFile(
  //   path.join(repo.workdir(), "./", fileName),
  //   fileContent
  // );

  // console.log("repo master commit", repo.refreshIndex());

  // let check = await index.addByPath(fileName);
  // let get = await index.addByPath(path.posix.join("./", fileName));
  // console.log("chceks", check);
  // await index.write();
  // const oid = await index.writeTree();
  // console.log("oid", oid);
  return;
  // // this file is in a subdirectory and can use a relative path
  // await index.addByPath(path.posix.join("./", fileName));
  // // this will write both files to the index
  // await index.write();

  // const oid = await index.writeTree();

  // const parent = await repo.getHeadCommit();
  // console.log("parent", oid, parent);
};

export const getCommit = async () => {
  try {
    const repo = await Git.Repository.open("./");
    const commit = await repo.getCommit(
      "515ffe1b41b80ae0ca3568539cf345801d4a8d47"
    );
    const entry = await commit.getEntry("README.md");
    const blob = await entry.getBlob();

    console.log(entry.name(), entry.sha(), blob.rawsize() + "b");
    console.log("========================================================\n\n");
    const firstTenLines = blob
      .toString()
      .split("\n")
      .slice(0, 10)
      .join("\n");
    console.log(firstTenLines);
    console.log("...");
  } catch (e) {
    console.log(e);
  }
};

export const addBranch = async () => {
  Git.Repository.open(path.resolve("./", "../../.git")).then(function(repo) {
    // Create a new branch on head
    return repo.getHeadCommit().then(function(commit) {
      return repo.createBranch("new-brancheds", commit, 0);
    });
  });
};

export const Practice = async () => {
  try {
    const repo = await Git.Repository.open("./");
    let oid = Git.Oid.fromString("515ffe1b41b80ae0ca3568539cf345801d4a8d47");
    console.log("Sha hex string:", oid.toString());
    const odb = await repo.odb();

    const object = await odb.read(oid);

    const data = object.data();
    const type = object.type();
    const size = object.size();

    console.log("Object size and type:", size, type);
    console.log("Raw data: ", data.toString().substring(100), "...");
    oid = await odb.write(
      "test data",
      "test data".length,
      Git.Object.TYPE.BLOB
    );

    // Now that we've written the object, we can check out what SHA1 was
    // generated when the object was written to our database.
    console.log("Written Object: ", oid.toString());

    oid = Git.Oid.fromString("515ffe1b41b80ae0ca3568539cf345801d4a8d47");

    // Many methods in **nodegit** are asynchronous, because they do file
    // or network I/O. By convention, all asynchronous methods are named
    // imperatively, like `getCommit`, `open`, `read`, `write`, etc., whereas
    // synchronous methods are named nominatively, like `type`, `size`, `name`.

    const commit = await repo.getCommit(oid);

    console.log(
      "Commit:",
      commit.message(),
      commit.author().name(),
      commit.date()
    );
    const parents = await commit.getParents();
    for (const parent of parents) {
      console.log("Parent:", parent.toString());
    }

    const author = Git.Signature.now("Scott Chacon", "schacon@gmail.com");
    const committer = Git.Signature.now("Scott A Chacon", "scott@github.com");
    const author1 = Git.Signature.now(
      "sarfarazahmedkhan",
      "sarfarazahmedkhankhan@gmail.com"
    );
    const committer1 = Git.Signature.now(
      "sarfarazahmedkhan",
      "sarfarazahmedkhankhan@gmail.com"
    );

    const treeId = Git.Oid.fromString(
      "515ffe1b41b80ae0ca3568539cf345801d4a8d47"
    );
    const parentId = Git.Oid.fromString(
      "f68f571aad442ae821ceaaa65d5e5e91158abaee"
    );

    let tree = await repo.getTree(treeId);
    const parent = await repo.getCommit(parentId);

    oid = await repo.createCommit(
      null /* do not update the HEAD */,
      author,
      committer,
      "example commit",
      tree,
      [parent]
    );
    console.log("New Commit:", oid.toString());
  } catch (e) {
    console.log(e);
  }
};

export const uploadFileToGit = async () => {
  try {
    git.addConfig("user.email", "sarfarazahmedkhankhan@gmail.com");
    git.addConfig("user.name", "sarfarazahmedkhan");
    git.addRemote("origin", gitHubUrl);
    // Add all files for commit
    git.add(".").then(
      (addSuccess) => {
        console.log(addSuccess);
      },
      (failedAdd) => {
        console.log("adding files failed");
      }
    );
    // Commit files as Initial Commit
    git.commit("Intial commit by simplegit").then(
      (successCommit) => {
        console.log(successCommit);
      },
      (failed) => {
        console.log("failed commmit", failed);
      }
    );
    // Finally push to online repository
    git.push("origin", "master").then(
      (success) => {
        console.log("repo successfully pushed");
      },
      (failed) => {
        console.log("repo push failed");
      }
    );
    // const repo = await Git.Repository.open("./");

    // const index = await repo.refreshIndex();

    // // this file is in the root of the directory and doesn't need a full path
    // await index.addByPath(fileName);
    // // this file is in a subdirectory and can use a relative path
    // await index.addByPath(path.posix.join("./", fileName));
    // // this will write both files to the index
    // await index.write();

    // const oid = await index.writeTree();
    // console.log("check", oid);

    // const parent = await repo.getHeadCommit();
    // const author = Git.Signature.now(
    //   "sarfarazahmedkhan",
    //   "sarfarazahmedkhankhan@gmail.com"
    // );
    // const committer = Git.Signature.now(
    //   "sarfarazahmedkhan",
    //   "sarfarazahmedkhankhan@gmail.com"
    // );

    // const commitId = await repo.createCommit(
    //   "HEAD",
    //   author,
    //   committer,
    //   "message",
    //   oid,
    //   [parent]
    // );

    // console.log("New Commit: ", commitId);
  } catch (e) {
    console.log("check error now", e);
  }
};

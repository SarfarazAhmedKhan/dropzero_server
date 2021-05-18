<p align="center">
  <a href="http://nestjs.com/" target="blank"><span><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></span></a>
</p>

[travis-image]: https://api.travis-ci.org/nestjs/nest.svg?branch=master
[travis-url]: https://travis-ci.org/nestjs/nest
[linux-image]: https://img.shields.io/travis/nestjs/nest/master.svg?label=linux
[linux-url]: https://travis-ci.org/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="blank">Node.js</a> framework for building efficient and scalable server-side applications, heavily inspired by <a href="https://angular.io" target="blank">Angular</a>.</p>

# Drop-zero-Server

## About App

This app requires droppers to drop their csv containing records of claimers. User can claim their tokens. Dropper can view all the claimers history and their claims<br/>

- Functions/Modules
  - Dropper drop csv records of claimers
  - User claime their tokens
  - History record of claimers
  - Dropper can pause user claims
  - Dropper can withdraw thier csv records

### Integrated Stack

- Web3

## File Structure

<pre>
app    
├── src  
│     └── main.ts  
│     └── app.controller.spec.ts  
│     └── app.controller.ts  
│     └── app.module.ts    
│     └── app.service.ts     
│     └── dropper    
│     |   ├── csvrecord.model.ts    
│     |   ├── dropper.service.ts    
│     |   ├── dropper.controller.ts    
│     |   ├── dropper.model.ts    
│     |   └── dropper.module.ts
│     └── merkleroot    
│     |   ├── merkleroot.service.ts 
│     └── user    
│     |   ├── user.service.ts    
│     |   ├── user.controller.ts    
│     |   ├── user.model.ts    
│     |   └── user.module.ts
│     └── middleware         
│     |    ├── logger.middleware.ts    
│     └── utils   
│     |    ├── MerkleTree.ts     
│     |        └── balance-tree.ts   
│     |        └── merkle-tree.ts  
│     |    ├── constants.ts   
│     |    ├── dropContractAbi.ts
│     |    ├── fileuploading.ts   
│     └── main.ts         
└── gitignore  
└── package.json  
└── package-lock.json  
└── Readme.md  
└── nodeModules   

</pre>

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## License

Nest is [MIT licensed](LICENSE).

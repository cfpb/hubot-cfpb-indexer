# hubot-cfpb-indexer [![Build Status](https://img.shields.io/travis/cfpb/hubot-cfpb-indexer.svg?maxAge=2592000&style=flat-square)](https://travis-ci.org/cfpb/hubot-cfpb-indexer) [![npm](https://img.shields.io/npm/v/hubot-cfpb-indexer.svg?maxAge=2592000&style=flat-square)](https://www.npmjs.com/package/hubot-cfpb-indexer)

A Hubot script to index some useful cf.gov things for internal CFPB tooling.

See [`src/cfpb-indexer.coffee`](src/cfpb-indexer.coffee) for full documentation.

## Installation

In hubot project repo, run:

`npm install hubot-cfpb-indexer --save`

Then add **hubot-cfpb-indexer** to your `external-scripts.json`:

```json
["hubot-cfpb-indexer"]
```

## Sample Interaction

```
user1>> hubot start indexing
hubot>> Indexing initiated...
hubot>> Indexing complete!
```

```
user1>> hubot show index
hubot>> *returns JSON index*
```

Index can also be retrieved via HTTP by visiting `http://your-bot.com/cfpb-indexer?key=your-secret-key`
where `your-secret-key` shares the value of an environment variable named `HUBOT_CFPB_INDEXER_SECRET_KEY`.

## Contributing

Please read our general [contributing guidelines](CONTRIBUTING.md).

## Open source licensing info
1. [TERMS](TERMS.md)
2. [LICENSE](LICENSE)
3. [CFPB Source Code Policy](https://github.com/cfpb/source-code-policy/)

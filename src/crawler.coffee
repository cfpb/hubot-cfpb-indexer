crawler =
  createSiteIndex:(cb) ->
    
    # Do crawling and indexing and stuff
    # ...
    # ...

    err = null

    index = {
      foo: 1,
      bar: 2
    }

    cb(err, index)

module.exports = crawler

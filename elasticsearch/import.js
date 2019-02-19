var elasticsearch = require('elasticsearch');
var csv = require('csv-parser');
var fs = require('fs');

var esClient = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'info'
});

esClient.indices.delete({
  index: 'id'
}).then(function(){
  esClient.indices.create({ 
    index: 'id',
    body: {
      mappings: {
        call : {
          properties : {
            location: {
              type : "geo_point"
            },
            categ : {
              type: "text",
              fielddata: true
            }
          }
        }     
      }
    }
  }, (err, resp) => {
    if (err) console.trace(err.message);
  });
});

let calls = [];

fs.createReadStream('../911.csv')
    .pipe(csv())
    .on('data', data => {
      // TODO extract one line from CSV
      calls.push({
        id : data.id,
        location : {
          lat : data.lat,
          lon : data.lng
        },        
        desc : data.desc,
        zip : data.zip,
        title : data.title,
        categ : data.title.substring(0,data.title.indexOf(":")),
        event : data.title.substring(data.title.indexOf(":"), data.title.length),
        timeStamp : new Date(data.timeStamp),
        twp : data.twp,
        addr : data.addr
      });
    })
    .on('end', () => {
      // TODO insert data to ES
      esClient.bulk(createBulkInsertQuery(calls));
    });

    function createBulkInsertQuery(calls) {
      const body = calls.reduce((acc, call) => {
        const { id, location, desc, zip, title, categ, event, timeStamp, twp, addr } = call;
        acc.push({ index: { _index: 'id', _type: 'call'} })
        acc.push({ location, desc, zip, title, categ, event, timeStamp, twp, addr })
        return acc
      }, []);

      return { body };
    } 
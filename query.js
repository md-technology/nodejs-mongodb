/**
 * Created by tiwen.wang on 6/13/2015.
 */
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    DBRef = require('mongodb').DBRef,
    ObjectID = require('mongodb').ObjectID,
    assert = require('assert');

//var db = new Db('mdmap', new Server('localhost', 27017));
var db = new Db('mdmap', new Server('localhost', 27017));
// Establish connection to db
db.open(function(err, db) {
    // Create a collection we want to drop later
    db.collection('photo', function(err, collection) {
        collection.find({'location.position': [0,0]}, {}).toArray(function(err, docs) {
            console.log(err);
            for(var i = 0; i < docs.length; i++) {
                console.log(docs[i].width);
                console.log(docs[i].height);
            }

            db.close();
        });
    });
});
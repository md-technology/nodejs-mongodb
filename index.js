var fs = require('fs'),
    csv = require('csv');

var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    DBRef = require('mongodb').DBRef,
    ObjectID = require('mongodb').ObjectID,
    assert = require('assert');

var photoFile = 'photo.csv',
    detailsFile = 'photo_details.csv';

var db = new Db('mdmap', new Server('localhost', 27017));
// Establish connection to db
db.open(function(err, db) {
    console.log(err);
    // Create a collection we want to drop later
    db.collection('user', function(err, collection) {
        collection.find({username: 'user'}, {}).toArray(function(err, docs) {
            assert.equal(1, docs.length);
            //db.close();
            var user = docs[0];
            importPhoto(new DBRef('user', new ObjectID(user._id)));
        });
    });
});

function importPhoto(user) {
    fs.readFile(photoFile, 'utf8', function (err, data) {
        csv.parse(data, {columns: true}, function(err, photos){
            console.log("photos size = ", photos.length);
            fs.readFile(detailsFile, 'utf8', function (err, data) {
                csv.parse(data, {columns: true}, function(err, details){
                    console.log("details size = ", details.length);
                    insertPhoto(user, photos, details);
                });
            });
        });
    });
}

function insertPhoto(user, photos, details) {
    db.collection('photo', function(err, photoCollection) {
        db.collection('panoramioIndex', function(err, panoramioIndexCollection) {
            save(user, photos, details, photoCollection, panoramioIndexCollection);
        });

    });
}

function save(user, photos, details, photoCollection, panoramioIndexCollection) {
    var photoObjects = [];
    for(var i = 0; i < photos.length; i++) {
        var photo = photos[i];
        for(var j = 0; j < details.length; j++) {
            if(photo.id == details[j].id) {
                photo.details = details[j];
            }
        }
        photo.user = user;
        photo.location = {
            position: [Number(photo.lng), Number(photo.lat)],
            alt: Number(photo.alt),
            address: photo.address
        };
        if(photo.details.Orientation == 5 ||
            photo.details.Orientation == 6 ||
            photo.details.Orientation == 7 ||
            photo.details.Orientation == 8) {
            photo.width = photo.details.pixelYDimension;
            photo.height = photo.details.pixelXDimension;
        }else {
            photo.width = photo.details.pixelXDimension;
            photo.height = photo.details.pixelYDimension;
        }
        if(!photo.width) {
            photo.width = 100;
            photo.height = 100;
        }
        if(!photo.fileType) {
            photo.fileType = 'jpg';
        }

        photo.ossKey = photo.id+'.'+photo.fileType;
        photo.createDate = new Date();
        photo.deleted = false;
        delete photo.id;
        delete photo.lng;
        delete photo.lat;
        delete photo.alt;
        delete photo.address;
        delete photo.details.id;
        delete photo.modifyDate;
        delete photo.markBest;
        delete photo.owner_id;
        delete photo.travel_spot_id;
        if(!photo.details.DateTime) {
            photo.details.DateTime = new Date();
        }else {
            photo.details.DateTime = new Date(photo.details.DateTime);
        }
        if(!photo.details.DateTimeDigitized) {
            photo.details.DateTimeDigitized = new Date();
        }else {
            photo.details.DateTimeDigitized = new Date(photo.details.DateTimeDigitized);
        }
        if(!photo.details.DateTimeOriginal) {
            photo.details.DateTimeOriginal = new Date();
        }else {
            photo.details.DateTimeOriginal = new Date(photo.details.DateTimeOriginal);
        }
        if(!photo.details.GPSDateStamp) {
            photo.details.GPSDateStamp = new Date();
        }else {
            photo.details.GPSDateStamp = new Date(photo.details.GPSDateStamp);
        }

        if(photo.is360 == "b'1'") {
            photo.is360 = true;
        }else {
            photo.is360 = false;
        }

        //console.log(photo);
        photoObjects.push(photo);

        /*(function() {
            var po = photo;
            photoCollection.save(po, function(err, result) {
                var photoRef = new DBRef('photo', new ObjectID(po._id));
                for(var k = 0; k <= 18; k++) {
                    panoramioIndexCollection.save({
                        level: k,
                        position: po.location.position,
                        photo: photoRef
                    }, function(err, result) {
                    });
                }
            });
        })();*/
    }

    photoCollection.insert(photoObjects, {w: 1}, function(err, result) {
        console.log(err);
        db.close();
    });
}
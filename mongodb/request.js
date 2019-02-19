var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/911-calls';

MongoClient.connect(mongoUrl, (err, db) => {
    
    // TEST
    // db.collection('calls').find().sort({"timeStamp": 1}).limit(1).toArray(function (error , result) {
    //     if (error) throw error;
    //     console.log(result);
    //     db.close();
    // });

    // db.collection('calls').find({"title": "EMS: BACK PAINS/INJURY"}).count(function (error , result) {
    //     if (error) throw error;
    //     console.log(result);
    //     db.close();
    // });

    // REQUETE 1 :
    /*
    Compter le nombre d'appels autour de Lansdale dans un rayon de 500 mètres
    latitude  = 40.241493
    longitude = -75.283783
    Expected result = 717
    */
    db.collection('calls').find( { loc :
        { $near :
          { $geometry :
             { type : "Point" ,
               coordinates : [ -75.283783 , 40.241493 ] } ,
            $maxDistance : 500
     } } }).count(function (error , result) {
        console.log("\nREQUETE 1");
        if (error) throw error;
        console.log(result);
        db.close();
    });

    // REQUETE 2 :
    /*
    Compter le nombre d'appels par catégorie
    Le résultat attendu est :
    EMS  	 Fire 	Traffic
    75589 	23056  	54549
    */
    db.collection('calls').aggregate([{
        $group : {
            _id : "$category",
            count : { $sum: 1 }
        }
    }]).toArray(function (error , result) {
        console.log("\nREQUETE 2");
        if (error) throw error;
        console.log(result);
        db.close();
    });

    // REQUETE 3 :
    /*
    Trouver les 3 mois ayant comptabilisés le plus d'appels
    Le résultat attendu est :
    01/2016  	 10/2016 	12/2016
    13096 	     12502   	12162
    */
    db.collection('calls').aggregate([
        {
            $group : {
                _id : { month: { $month: "$date" }, year: { $year: "$date" } },
                count : { $sum: 1 }
            }
        },
        {
            $sort : {
                count : -1
            }
        },
        {
            $limit : 3
        }
    ]).toArray(function (error , result) {
        console.log("\nREQUETE 3");
        if (error) throw error;
        console.log(result);
        db.close();
    });

    // REQUETE 4 :
    /*
    Trouver le top 3 des villes avec le plus d'appels pour overdose
    Le résultat attendu est :
    POTTSTOWN 	 NORRISTOWN 	UPPER MORELAND
    203 	        180  	        110
    */
    db.collection('calls').aggregate([
        { 
            $match: { 
                motif: "OVERDOSE"
            } 
        },
        {
            $group : {
                _id : { city : "$twp"},
                count : { $sum: 1 }
            }
        },
        {
            $sort : {
                count : -1
            }
        },
        {
            $limit : 3
        }
    ]).toArray(function (error , result) {
        console.log("\nREQUETE 4");
        if (error) throw error;
        console.log(result);
        db.close();
    });
});
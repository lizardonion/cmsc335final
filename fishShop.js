const path = require("path");
const axios = require('axios');
const cheerio = require('cheerio')

require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })

const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.i64ml.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};

const fs = require('fs');
const express = require("express");
const bodyParser = require('body-parser');
const app = express();
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
process.stdin.setEncoding("utf8");

const { MongoClient, ServerApiVersion } = require('mongodb');

/*if (process.argv.length != 3) {
    process.stdout.write(`Usage fishShop.js jsonFile`);
    process.exit(1);
}*/

const portNumber = 3000;
app.listen(portNumber);
console.log(`To access server: http://localhost:${portNumber}`);

const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
    const dataInput = process.stdin.read().toLowerCase();
    if (dataInput !== null) {
      const command = dataInput.trim();
      if (command === "stop") {
        console.log("Shutting down the server");
        process.exit(0);
      } else{
        process.stdout.write(`Invalid command: ${command}\n`);
      }
      process.stdout.write(prompt);
      process.stdin.resume();
    }
});

async function processFishOrder(name, email, fish, info){
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        let toAdd = {name: name, email: email, fish: fish, info: info}
        const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(toAdd);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }     
}

async function reviewFishOrder(email){
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        let filter = {email: email};
        const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);

        if (result) {
            return result;
        } else {
            return {name: "NONE", email: "NONE", fish: "NONE", info: "NONE"};
        }     
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
       
}

async function deleteFishOrders() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
        return result.deletedCount;

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

app.get("/", (request, response) => {
    response.render("index", {});
});

app.get("/orderFish", (request, response) => {
    response.render("fishOrderForm", {});
});

function randomDate(start, end) {
    return Math.floor(Math.random() * (end - start + 1)) + start;
}
  
app.post("/orderFish", async(request, response) => {
    const datay = request.body;
    processFishOrder(datay.name, datay.email, datay.fish, datay.info);
    day = randomDate(10, 28);
    dateText = `202208${day}`;
    console.log(dateText);
    const options = {
        method: 'GET',
        url: 'https://sea-surface-temperature.p.rapidapi.com/historical',
        params: {
          latlon: '25.80423,-80.12441',
          startDate: `${dateText}`,
          endDate: '20220829'
        },
        headers: {
          'x-rapidapi-key': 'd6369be944msh8405bfa0b9d5c89p194149jsnbbc1d17a9805',
          'x-rapidapi-host': 'sea-surface-temperature.p.rapidapi.com'
        }
      };
      
      try {
          const water = await axios.request(options);
          console.log(water.data);
          const temp = water.data[0].tempF;
          response.render("fishOrderInfo", {name: datay.name, email: datay.email, fish: datay.fish, info: datay.info, temp: temp});

      } catch (error) {
          console.error(error);
      }
});

app.get("/reviewFishOrder", (request, response) => {
    response.render("reviewFishOrder", {});
});

app.post("/reviewFishOrder", async (request, response) => {
    const databody = request.body;
    result = await reviewFishOrder(databody.email);
    temp = "should've written it down when you ordered!"
    response.render("fishOrderInfo", {name: result.name, email: result.email, fish: result.fish, info: result.info, temp: temp});
});

app.get("/removeFish", (request, response) => {
    response.render("removeFish", {});
});

app.post("/removeFish", async (request, response) => {
    result = await deleteFishOrders();
    response.render("fishRemovedConfirm", {});
});




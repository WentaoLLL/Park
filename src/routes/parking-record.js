const express = require("express");
const fs = require("fs");
const path = require("path");
const dateFns = require("date-fns");

const router = express.Router();

const parkingRecordsDbFile = path.join(
  __dirname,
  "../data/parking-records.json",
);

let parkingRecords = [];

router.get("/update", (req, res) => {
  if ("no" in req.query && "status" in req.query && "token" in req.query) {
    if (req.query.token === "9JPfjEi?Gkl['.Q") {
      let parkingRecord = {
        no: parseInt(req.query.no),
        status: parseInt(req.query.status),
        timestamp: Date.now(),
      };
      parkingRecords.push(parkingRecord);
      saveParkingRecordsDb();
      res.send("ok");
      return;
    }
  }

  res.send("nok");
});

router.get("/spot", (req, res) => {
  if (!req.session.user) {
    res.redirect("/user/login");
    return;
  }
  if ("no" in req.query) {
    let records = [];
    let no = parseInt(req.query.no);
    for (let i = 0; i < parkingRecords.length; i++) {
      if (no === parkingRecords[i].no) {
        records.push(parkingRecords[i]);
      }
    }
    let reducedRecords = [];
    let lastStatus = -1;
    for (let i = 0; i < records.length; i++) {
      let record = records[i];
      let endTimestamp;
      if (i + 1 < records.length) {
        endTimestamp = records[i + 1].timestamp;
      } else {
        endTimestamp = Date.now();
      }
      if (record.status !== lastStatus) {
        lastStatus = record.status;
        reducedRecords.push(Object.assign({}, record));
      }
      let reducedRecord = reducedRecords[reducedRecords.length - 1];
      reducedRecord.endTimestamp = endTimestamp;
    }
    let totalBilling = 0;
    for (let i = 0; i < reducedRecords.length; i++) {
      let reducedRecord = reducedRecords[i];
      reducedRecord.duration =
        Math.abs(reducedRecord.endTimestamp - reducedRecord.timestamp) / 36e5;
      if (reducedRecord.status === 1) {
        reducedRecord.rate = 1.2;
        reducedRecord.billing =
          Math.ceil(reducedRecord.duration) * reducedRecord.rate;
        totalBilling += reducedRecord.billing;
      }
    }
    res.render("parking-record-spot", {
      records: reducedRecords,
      no: no,
      totalBilling: totalBilling,
      dateFns: dateFns,
    });
  } else {
    res.redirect("/");
  }
});

router.get("/list", (req, res) => {
  if (!req.session.user) {
    res.redirect("/user/login");
    return;
  }
  let groupedRecords = [];
  for (let i = 0; i < parkingRecords.length; i++) {
    let added = false;
    for (let j = 0; j < groupedRecords.length; j++) {
      if (groupedRecords[j].no === parkingRecords[i].no) {
        groupedRecords[j].records.push(parkingRecords[i]);
        added = true;
        break;
      }
    }
    if (!added) {
      groupedRecords.push({
        no: parkingRecords[i].no,
        records: [parkingRecords[i]],
      });
    }
  }
  for (let j = 0; j < groupedRecords.length; j++) {
    let groupedRecord = groupedRecords[j];
    groupedRecord.records.sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
    );
    let records = groupedRecords[j].records;
    groupedRecord.timestamp = records[records.length - 1].timestamp;
    groupedRecord.status = records[records.length - 1].status;

    let availableTime = 0;
    let occupiedTime = 0;
    for (let i = 0; i < records.length; i++) {
      let record = records[i];
      let endTimestamp;
      if (i + 1 < records.length) {
        endTimestamp = records[i + 1].timestamp;
      } else {
        endTimestamp = Date.now();
      }
      let timeDiff = endTimestamp - record.timestamp;
      if (record.status === 0) {
        availableTime += timeDiff;
      } else {
        occupiedTime += timeDiff;
      }
    }

    groupedRecord.availableTime = availableTime;
    groupedRecord.occupiedTime = occupiedTime;
    groupedRecord.totalTime = availableTime + occupiedTime;

    delete groupedRecord.records;
  }

  groupedRecords.sort((a, b) => (a.no < b.no ? -1 : a.no > b.no ? 1 : 0));

  console.log(groupedRecords);

  res.render("parking-record-list", {
    records: groupedRecords,
    dateFns: dateFns,
  });
});

function initParkingRecordsDb() {
  fs.readFile(parkingRecordsDbFile, "utf-8", (err, data) => {
    if (err) {
      fs.writeFile(parkingRecordsDbFile, "[]", (err) => {
        if (err) {
          console.log("successfully initialized parking-records database");
          return;
        }
        console.log("cannot initialize parking-records database");
      });
      return;
    }
    parkingRecords = JSON.parse(data);
    console.log("successfully loaded parking-records from database");
  });
}

function saveParkingRecordsDb() {
  fs.writeFile(parkingRecordsDbFile, JSON.stringify(parkingRecords), (err) => {
    if (err) {
      console.log("cannot save parking-records into database");
      return;
    }
    console.log("successfully saved parking-records into database");
  });
}

initParkingRecordsDb();

module.exports = router;

const express = require("express");
const api = require("./api/v1");
const differenceInDays = require('date-fns/differenceInDays')

const now = new Date();
const commit = new Date(1611497751 * 1000);
console.log(now);
console.log(commit)
console.log(differenceInDays(now, commit));
const app = express();
app.use("/api/v1", api);
app.listen(1337);
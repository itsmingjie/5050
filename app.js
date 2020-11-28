const config = require("./config");

const express = require("express");
const path = require("path");
const AirtablePlus = require("airtable-plus");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const minifyHTML = require('express-minify-html')
const compression = require('compression')

const airtable = new AirtablePlus({
  baseID: config.airtable.base,
  apiKey: config.airtable.key,
  tableName: "Collection",
});

const app = express();
const http = require("http").createServer(app);

app.engine("html", require("ejs").renderFile);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(
  minifyHTML({
    override: true,
    exception_url: false,
    htmlMinifier: {
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeEmptyAttributes: true,
      minifyJS: true,
      minifyCSS: true,
    },
  })
);
app.use(compression());

const guessedMiddleware = (req, res, next) => {
  if (req.cookies && req.cookies.attempted) {
    res.redirect("/result");
  } else {
    next();
  }
};

app.get("/", guessedMiddleware, (req, res) => {
  res.render(__dirname + "/views/index.html");
});

app.get("/result", async (req, res) => {
  const allData = await airtable.read();

  let n = 0;
  let x = 0;
  let a = [["Guess"]];

  allData.forEach((d) => {
    a.push([d.fields.guess]);
    if (d.fields.guess <= 50) x++;
    n++;
  });

  res.render(__dirname + "/views/results.html", {
    p: ((x / n) * 100).toFixed(2),
    n,
    a: JSON.stringify(a),
  });
});

app.post("/submit", guessedMiddleware, async (req, res) => {
  const guess = req.body.value;
  const email = req.body.email;

  await airtable
    .create({
      guess: Math.round(guess),
      email: email,
      ts: new Date().toISOString(),
    })
    .catch((err) => {
      console.log(err);
    });

  res.cookie("attempted", true, { maxAge: 253402300000000 });
  res.redirect("/result");
});

app.use("/static", express.static(path.join(__dirname, "public")));

http.listen(config.port, () => {
  console.log("5050 is runnning on " + config.port);
});

var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", { title: "Glider" });
});

router.get("/grid", function(req, res, next) {
  res.render("grid", {});
});

router.get("/control", function(req, res, next) {
  res.render("control", {
    soundList: req.app.get("soundList")
  });
});

module.exports = router;

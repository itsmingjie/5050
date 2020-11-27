require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  airtable: {
    base: process.env.AIRTABLE_BASE,
    key: process.env.AIRTABLE_KEY,
  },
};

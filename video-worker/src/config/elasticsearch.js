const { Client } = require("@elastic/elasticsearch");

const isElasticsearchEnabled = () => process.env.ELASTICSEARCH_ENABLED !== "false";

let client = null;

const getElasticsearchClient = () => {
  if (!isElasticsearchEnabled()) return null;
  if (!client) {
    client = new Client({
      node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    });
  }
  return client;
};

module.exports = {
  getElasticsearchClient,
  isElasticsearchEnabled,
};

const { MongoClient, ServerApiVersion } = require("mongodb");

const mongoClient = new MongoClient(process.env.connection_string_mongo, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// Connect the client to the server (optional starting in v4.7)
		await mongoClient.connect();
		// Send a ping to confirm a successful connection
		await mongoClient.db("admin").command({ ping: 1 });
		console.log("Pinged your deployment. You successfully connected to MongoDB!");
	} finally {
		// Ensures that the client will close when you finish/error
		await mongoClient.close();
	}
}
run().catch(console.dir);

module.exports = mongoClient;

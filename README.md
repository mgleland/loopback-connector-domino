# loopback-connector-domino

LoopBack connector for Domino.  This connector uses the Domino Access Services (DAS) data API
to create, read, update and delete documents in a Domino application.

## Getting Started

The easiest way to get started is to add **loopback-connector-domino** to the
[LoopBack tutorial application](https://github.com/strongloop/loopback-getting-started).
Connect the Domino data source to the CoffeeShops model, get familiar with the connector,
and then use it in your own LoopBack API.

### Prerequisites

- A Domino server running the HTTP task.  This server must have the Domino data API enabled.
- Node.js and npm.
- A clone of [loopback-getting-started](https://github.com/strongloop/loopback-getting-started).
If you haven't already done so, clone [loopback-getting-started](https://github.com/strongloop/loopback-getting-started) 
first.

### Installation

Clone this repository on the same system where you installed **loopback-getting-started**.  Then 
copy [Coffee.nsf](sample-nsf/Coffee.nsf) to the data directory of your Domino server.

**Important:** [Coffee.nsf](sample-nsf/Coffee.nsf) is just a sample database to get you started.
This connector will work with any Domino database enabled for the data API.

### Checkout step2 of loopback-getting-started

```
cd /loopback-getting-started
git checkout -f step2
npm install
```

This step is required because **step2** of the tutorial connects the CoffesShops model
to a SQL server hosted by StrongLoop.  In a minute, we'll show you how to switch the
data source from SQL to Domino.

### Add loopback-connector-domino to loopback-getting-started

```
cd /loopback-getting-started
npm install --save /loopback-connector-domino
```

Of course, in the `npm install` step above you need to specify the full path to the location
where you cloned **loopback-connector-domino**.

### Modify loopback-getting-started

First, remove **/loopback-getting-started/server/boot/create-sample-models.js** from your local
repository.  You don't need this script because **Coffee.nsf** already includes some
sample data.

Add the following new data source to **/loopback-getting-started/server/datasources.json**:

```
  "myDominoDs": {
    "name": "myDominoDs",
    "connector": "domino",
    "serverURL": "http://your.server.com",
    "userName": "First Last",
    "password": "password",
    "database": "coffee.nsf",
    "view": "shops",
    "form": "Shop"
  }
```

Be sure to tune the values of `serverURL`, `userName` and `password` to your specific Domino
server.  The `userName` value can be any user that can authenticate to your Domino server
over HTTP.

Now replace the CoffeeShop model data source in **/loopback-getting-started/server/model-config.json**.
Specify `myDominoDs` instead of `mysqlDs`:

```
  "CoffeeShop": {
    "dataSource": "myDominoDs",
    "public": true
  }
```

### Try the Modified LoopBack API

```
cd /loopback-getting-started
node .
```

Now open the API Explorer (http://localhost:3000/explorer) and try the **GET /CoffeeShops** operation.
It should read the list of coffee shops from the **Coffee.nsf** database on your Domino server.  

You can also try other operations including:

- **POST /CoffeeShops** - Create a new shop
- **PATCH /CoffeeShops/{id}** - Update an existing shop
- **DELETE /CoffeShops/{id}** - Remove a shop

Since the model is bound to the **Coffee.nsf** database, all operations are handled by
your Domino server.  You might want to verify the changes by opening **Coffee.nsf** in
the Notes client.  As you make each change in the API Explorer, compare the results in
Notes.

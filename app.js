//jshint esversion:6

// creating const for multiple nodes modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

//app using express.js
const app = express();

//setting the app to use ejs/bodyparser/express
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//connecting MongoDB
mongoose.connect("mongodb+srv://admin-euphros:password@cluster0-bux23.mongodb.net/todolistDB", {useNewUrlParser: true});

//Creating the item Schema
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

//Creating the 3 default item in the Lists.
const item1 = new Item({
  name: "Welcome to your To do List!"
});

const item2 = new Item({
  name: "<-- Hit this one to delete an item."
});

const item3 = new Item({
  name: "Hit the + button to add an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//Creating get function for default "Today" List.
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

  if (foundItems.length === 0) {
    Item.insertMany(defaultItems, function(err){
      if (err){
        console.log(err);
      } else {
        console.log("Successfully saved default items to the DB.");
      }
    });
    res.redirect("/");
  } else{
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  }

  });
});

//Creating get function for user created random Lists.
app.get("/:customListName", function(req, res){

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){

    if (!err){

      if (!foundList){

        // Create a new List
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

// Post function to add items in the appropriate list
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// Post function to delete items in the appropriate list
app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Sucessfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items:  {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

//listening on the correct port on Heroku
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

//logging to see if server is working on port 3000
app.listen(port, function() {
  console.log("Server has started successfully!");
});

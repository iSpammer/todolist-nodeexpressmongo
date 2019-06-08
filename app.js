//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-ossama:ieatmongoDB123@cluster0-ft2uy.mongodb.net/todolistDB", {
    useNewUrlParser: true
});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
    const day = date.getDate();

    Item.find({}, function (err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully savevd default items to DB.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                currTime: day,
                listTitle: "Today",
                newListItems: foundItems
            });
        }
    });

});

app.get("/:listName", function (req, res) {
    const listName = _.capitalize(req.params.listName);
    const day = date.getDate();

    List.findOne({
        name: listName
    }, function (err, resultList) {
        if (!err) {
            if (resultList) {
                res.render("list", {
                    listTitle: resultList.name,
                    newListItems: resultList.items
                });

            } else {

                const list = new List({
                    currTime : day,
                    name: listName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + listName);
            }
        }
    });



});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({
            name: listName
        }, function (err, result) {
            result.items.push(item);
            result.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.cuslistName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({
            name: listName
        }, {
            $pull: {
                items: {
                    _id: checkedItemId
                }
            }
        }, (err, resultList) => {
            if (!err) {
                console.log(listName);
                res.redirect("/"+listName);
            }
        });
    }
});

app.get("/about", function (req, res) {
    res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port 3000");
});

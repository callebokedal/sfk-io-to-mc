// routie('users/bob'); 
let setupRouters = () => {
    console.log("routers.js: setting up routers");
    routie({
    '': () => {
        console.log("routers.js: Start");
        //$("#pageBody").innerHTML = "s";
    },
    'import-io': function () {
        console.log("Import from IO Excel file");
        import_file("ioFile", storage_name+"_io");
        // Show
        routie.navigate("list-io");
    },
    'import-mc': function () {
        console.log("Import from IO Excel file");
        import_file("mcFile", storage_name+"_mc");
        // Show
        routie.navigate("list-mc");
    },
    'list-io': function () {
        console.log("Show import IO list");
        persons = JSON.parse(sessionStorage.getItem(storage_name+"_io"));
        //console.log("persons: ", persons);
        data = {}
        data.type = "io"
        data.persons = persons;
        getTemplate('listTemplate', '#pageBody', data);
    },
    'list-mc': function () {
        console.log("Show import MC list");
        persons = JSON.parse(sessionStorage.getItem(storage_name+"_mc"));
        //console.log("persons: ", persons);
        let data = {}
        data.type = "mc"
        data.persons = persons;
        getTemplate('listTemplate', '#pageBody', data);
    },
    'list-updated': function () {
        console.log("list-updated...");
        io_persons = JSON.parse(sessionStorage.getItem(storage_name+"_io"));
        mc_persons = JSON.parse(sessionStorage.getItem(storage_name+"_mc"));
        //console.log("io_persons", io_persons);
        //console.log("mc_persons", mc_persons);
        let data = {}
        data.type = "updated"
        data.persons = get_updated(io_persons, mc_persons);
        document.getElementById('pageBody').innerHTML = "";
        getTemplate('listTemplate', '#pageBody', data);
    },
    'list-deleted': function () {
        console.log("list-deleted");
        io_persons = JSON.parse(sessionStorage.getItem(storage_name+"_io"));
        mc_persons = JSON.parse(sessionStorage.getItem(storage_name+"_mc"));
        //console.log("io_persons", io_persons);
        //console.log("mc_persons", mc_persons);
        let data = {}
        data.type = "deleted"
        data.persons = get_deleted(io_persons, mc_persons);
        document.getElementById('pageBody').innerHTML = "";
        getTemplate('listTemplate', '#pageBody', data);
    },
    'export-updated': function () {
        save_updated();
    },
    'export-deleted': function () {
        save_deleted();
    }
    })
};
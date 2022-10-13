// routie('users/bob'); 
let setupRouters = () => {
    console.log("routers.js: setting up routers");
    routie({
    '': () => {
        console.log("routers.js: Start", getShortTimestamp());
        //$("#pageBody").innerHTML = "s";
    },
    'import-io': function () {
        console.log("Import from IO Excel file");
        //import_file("ioFile", storage_name+"_io");
        importFile("ioFile", storage_name+"_io");
        // Show
        routie.navigate("list-io");
    },
    'import-io_fee_payed': function () {
        console.log("Import from IO Fee Payed Excel file");
        importFile("io_fee_payed_file", storage_name+"_io_fees_payed");
        // Show
        routie.navigate("list-io_fee_payed");
    },
    'import-io_fee_sent': function () {
        console.log("Import from IO Fee Sent Excel file");
        importFile("io_fee_sent_file", storage_name+"_io_fees_sent");
        // Show
        routie.navigate("list-io_fee_sent");
    },
    'import-io_fee_overdue': function () {
        console.log("Import from IO Fee Overdue Excel file");
        importFile("io_fee_overdue_file", storage_name+"_io_fees_overdue");
        // Show
        routie.navigate("list-io_fee_overdue");
    },
    'import-mc': function () {
        console.log("Import from IO Excel file");
        //import_file("mcFile", storage_name+"_mc");
        importFile("mcFile", storage_name+"_mc");
        // Show
        routie.navigate("list-mc");
    },
    'list-io': function () {
        console.log("Show import IO list");
        persons = JSON.parse(sessionStorage.getItem(storage_name+"_io"));
        data = {}
        data.type = "io"
        data.persons = persons;
        getTemplate('listTemplate', '#pageBody', data);
    },
    'list-io_fee_payed': function () {
        console.log("Show import IO Fee Payed list");
        persons = JSON.parse(sessionStorage.getItem(storage_name+"_io_fees_payed"));
        data = {}
        data.type = "io_fee_payed"
        data.persons = persons;
        getTemplate('listTemplate', '#pageBody', data);
    },
    'list-io_fee_sent': function () {
        console.log("Show import IO Fee Sent list");
        persons = JSON.parse(sessionStorage.getItem(storage_name+"_io_fees_sent"));
        data = {}
        data.type = "io_fee_sent"
        data.persons = persons;
        getTemplate('listTemplate', '#pageBody', data);
    },
    'list-io_fee_overdue': function () {
        console.log("Show import IO Fee Overdue list");
        persons = JSON.parse(sessionStorage.getItem(storage_name+"_io_fees_overdue"));
        data = {}
        data.type = "io_fee_overdue"
        data.persons = persons;
        getTemplate('listTemplate', '#pageBody', data);
    },
    'list-mc': function () {
        console.log("Show import MC list");
        persons = JSON.parse(sessionStorage.getItem(storage_name+"_mc"));
        console.log("persons: ", persons);
        let data = {}
        data.type = "mc"
        data.persons = persons;
        getTemplate('listTemplate', '#pageBody', data);
    },
    'list-members': function () {
        console.log("list-members");
        io_persons = JSON.parse(sessionStorage.getItem(storage_name+"_io"));
        io_fees_payed = JSON.parse(sessionStorage.getItem(storage_name+"_io_fees_payed"));
        io_fees_sent = JSON.parse(sessionStorage.getItem(storage_name+"_io_fees_sent"));
        io_fees_overdue = JSON.parse(sessionStorage.getItem(storage_name+"_io_fees_overdue"));
        data = {}
        data.type = "members"
        data.persons = get_members(io_persons, io_fees_payed, io_fees_sent, io_fees_overdue);
        getTemplate('listTemplate', '#pageBody', data);
    },
    'list-feeNotSent': function () {
        console.log("list-feeNotSent");
        io_persons = JSON.parse(sessionStorage.getItem(storage_name+"_io"));
        io_fees_payed = JSON.parse(sessionStorage.getItem(storage_name+"_io_fees_payed"));
        io_fees_sent = JSON.parse(sessionStorage.getItem(storage_name+"_io_fees_sent"));
        io_fees_overdue = JSON.parse(sessionStorage.getItem(storage_name+"_io_fees_overdue"));
        data = {}
        data.type = "io_fee_not_sent"
        data.persons = get_fees_not_sent(io_persons, io_fees_payed, io_fees_sent, io_fees_overdue);
        getTemplate('listTemplate', '#pageBody', data);
    },
    'list-myclub_import': function () {
        console.log("list-myclub_import...");
        io_persons = JSON.parse(sessionStorage.getItem(storage_name+"_io"));
        mc_persons = JSON.parse(sessionStorage.getItem(storage_name+"_mc"));
        //console.log("io_persons", io_persons);
        //console.log("mc_persons", mc_persons);
        let data = {}
        data.type = "mc_import"
        data.persons = get_myclub_import(io_persons, mc_persons);
        document.getElementById('pageBody').innerHTML = "";
        getTemplate('listTemplate', '#pageBody', data);
    },
    'export-members': function () {
        save_members();
    },
    'export-feeNotSent': function () {
        save_feeNotSent();
    },
    'export-myclub_import': function () {
        save_myclub_import();
    },
    'export-deleted': function () {
        save_deleted();
    }
    })
};
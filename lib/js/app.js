'use strict';

// Settings
const storage_name = 'sfk-io-to-mc';

let year = new Date().getFullYear();
let age = (birthDate) => {
    return (year - birthDate.substring(0,4)) + " år";
}

let getTemplate = (tid, el, data = {}) => {
    let elem = document.querySelector(el);
    if(elem) {
        var e = _.unescape(document.querySelector(`script#${tid}`).innerHTML);
        var t = _.template(e);
        var r = t({'data':data});
        elem.innerHTML = r;
    } else {
        console.error("getTemplate - element missing: ", tid);
    }
}

/*let selectAll = () => {
    let persons = JSON.parse(sessionStorage.getItem(storage_name));
    persons = _.each(persons, (person) => {
        person.print = true;
    });
    sessionStorage.setItem(storage_name,JSON.stringify(persons));
    routie.navigate("list");
}

let deselectAll = () => {
    let persons = JSON.parse(sessionStorage.getItem(storage_name));
    persons = _.each(persons, (person) => {
        person.print = false;
    });
    sessionStorage.setItem(storage_name,JSON.stringify(persons));
    routie.navigate("list");
}*/


let processExcel = (data, storage_id) => {
    console.log("app.js: processExcel");
    //Read the Excel File data.
    let workbook = XLSX.read(data, {
        type: 'binary'  
    });

    //Fetch the name of First Sheet.
    let firstSheet = workbook.SheetNames[0];

    //Read all rows from First Sheet into an JSON array.
    let excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[firstSheet]);
    
    let persons = []; 
    for (let person of excelRows) {
        persons.push(person);
    }

    // Rename/convert properties
    /*persons = persons.map((p) => {
        return {
            id: _.trim(p['IdrottsID']),
            name: _.trim(p['Förnamn']) + ' ' + _.trim(p['Efternamn']),
            streetaddress: _.trim(p['Folkbokföring - Gatuadress']),
            postalcode: _.trim(p['Folkbokföring - Postnummer']),
            postaladdress: _.trim(p['Folkbokföring - Postort']),
            co_address: _.trim(p['Folkbokföring - c/o adress']),
            family: _.trim(p['Familj']),
            birthDate: _.trim(p['Födelsedat./Personnr.']),
            groups: _.trim(p['Grupp/Lag/Arbetsrum/Familj']),
            //print: true,
            //type: 'default',
            //householdKey: _.replace(_.lowerCase(_.trim(p['Folkbokföring - Gatuadress'])+_.trim(p['Folkbokföring - Postort'])),/ /g,'')
        }
    });
    */

    // Mark MC_IngenTidning
    //persons = _.map(persons, markIngenTidning);

    // Keep only one per family
    //persons = _.sortBy(persons, [function(p) { return p.birthDate; }]); // To get oldest person as family representant
    //persons = _.map(persons, markFamilyRepresentant, persons);

    // Only one per address
    //let householdList = []; // Keep track of "households" - to avoid duplicates per household
    // Sort again by age - not sure if filter above affects order or not
    //persons = _.sortBy(persons, [function(p) { return p.birthDate; }]); // To get oldest person as family representant
    //persons = _.map(persons, markOnePerHousehold, persons);

    // Sort by postnummer - by request
    //persons = _.sortBy(persons, [function(p) { return p.postalcode; }]);

    // Save result
    sessionStorage.setItem(storage_id, JSON.stringify(persons));
    //console.log("index.html: list stored");
};

/** Importing Excel file */
let import_file = (form_id, storage_id) => {
    console.log("import_file")
    let fileUpload = document.getElementById(form_id);

    // Works
    //document.getElementById("viewReport").removeAttribute("disabled");

    // Validate whether File is valid Excel file.
    let regex = /^([a-zA-Z0-9\s_\\.-:]).+(.xls|.xlsx|.xlsb)$/;
    if (regex.test(fileUpload.value.toLowerCase())) {
        if (typeof (FileReader) != "undefined") {
            let reader = new FileReader();
            //For Browsers other than IE.
            if (reader.readAsBinaryString) {
                reader.onload = function (e) {
                    processExcel(e.target.result, storage_id);
                };
                reader.readAsBinaryString(fileUpload.files[0]);
            } else {
                //For IE Browser.
                reader.onload = function (e) {
                    var data = "";
                    var bytes = new Uint8Array(e.target.result);
                    for (var i = 0; i < bytes.byteLength; i++) {
                        data += String.fromCharCode(bytes[i]);
                    }
                    processExcel(data, storage_id);
                };
                reader.readAsArrayBuffer(fileUpload.files[0]);
            }
        } else {
            alert("Den här webbläsaren har inte stöd för HTML5 - vilket är ett krav");
        }
    } else {
        alert("Vald fil är ogiltig!");
    }
}

let filterList = (listId, tableId, colIdx) => {
    // Declare variables
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById(listId);
    filter = input.value.toLowerCase();
    table = document.getElementById(tableId);
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 1; i < (tr.length-1); i++) {
        td = tr[i].getElementsByTagName("td")[colIdx];
        console.log("td", td);
        if (td) {
            txtValue = td.textContent || td.innerText;
            //console.log("text", txtValue);
            if (txtValue.toLowerCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

let clearListFilter = (listId, tableId, colIdx) => {
    let el = document.getElementById(listId);
    el.value="";
    filterList(listId, tableId, colIdx);
}

let makeDiffKey = (fname,lname,id) => {
    //return _.trim(fname.replaceAll(" ","__")).toLocaleLowerCase() +"_"+ _.trim(lname.replaceAll(" ","__")).toLocaleLowerCase() +"_"+ id.substring(0,8);
    return id.substring(0,8);
}

let convertIOtoMC = (id,fname,lname) => {
    return 
}

let convertSex = (io_value) => {
    if(io_value == "Man") {
        return "M";
    } else if(io_value == "Kvinna") {
        return "W"
    }
    console.error("Kunde inte konvertera kön: ", io_value);
    return "";
}

let identify_and_store_diff = (io_persons, mc_persons) => {
    _.forEach(io_persons, function(p) {
        p.comp_id = makeDiffKey(p["Förnamn"], p["Efternamn"], p["Födelsedat./Personnr. (ååååmmdd-xxxx)"]);
    });
    _.forEach(mc_persons, function(p) {
        p.comp_id = makeDiffKey(p["Förnamn"], p["Efternamn"], p["Personnummer"]);
    });

    sessionStorage.setItem(storage_name+"_io", JSON.stringify(io_persons));
    sessionStorage.setItem(storage_name+"_mc", JSON.stringify(mc_persons));

    let updated = []; // Or new
    let deleted = [];
    _.forEach(mc_persons, function(p) {
        let io_person = _.find(io_persons, function(o) { return o.comp_id == p.comp_id; });
        if(_.isEmpty(io_person)) {
            // Person to be deleted
            deleted.push(_.pick(p, ['Personnummer','Förnamn','Efternamn','Adress','E-post']));
        } else {
            // New or updated
            updated.push({
                'Personnummer':io_person["Födelsedat./Personnr. (ååååmmdd-xxxx)"],
                'Förnamn': io_person["Förnamn"], 
                'Efternamn':io_person["Efternamn"], 
                'Kön': convertSex(io_person["Kön"]), 
                'c/o':io_person["Kontaktadress - c/o adress"], 
                'Adress':io_person["Kontaktadress - Gatuadress"], 
                'Postnummer':io_person["Kontaktadress - Postnummer"].replaceAll(" ",""), 
                'Postort':io_person["Kontaktadress – Postort"], 
                'Hemtelefon':io_person["Telefon bostad"], 
                'Arbetstelefon':io_person["Telefon arbete"],
                'Mobiltelefon':io_person["Telefon mobil"],
                'E-post':io_person['E-post kontakt'],
                'Datum registrerad':io_person["Medlem sedan"],
                'Kommentar':/*p['Kommentar']+*/io_person["Övrig medlemsinfo"],
                'Grupperingar':"NewOrUpdated",
                // TODO here:
                //'Cirkusledarutbildning':io_person[""],
                //'':io_person[""],
                //'':io_person[""],
                //'':io_person[""],
                //'':io_person[""],
                //'':io_person[""],
                //'Typ': 'Ny/uppdaterad'
            });
        }
    });
    //console.log("Ta bort: ", deleted);
    //console.log("Uppdaterade: ", updated);
    sessionStorage.setItem(storage_name+"_updated", JSON.stringify(updated));
    sessionStorage.setItem(storage_name+"_deleted", JSON.stringify(deleted));
}

/** Get new and updated persons by diff IO vs MC */
let get_updated = (io_persons, mc_persons) => {
    identify_and_store_diff(io_persons, mc_persons);
    return JSON.parse(sessionStorage.getItem(storage_name+"_updated"));
}
let get_deleted = (io_persons, mc_persons) => {
    identify_and_store_diff(io_persons, mc_persons);
    return JSON.parse(sessionStorage.getItem(storage_name+"_deleted"));
}

/*let togglePersonState = (id) => {
    let persons = JSON.parse(sessionStorage.getItem(storage_name));
    // Toggle value
    let p = _.find(persons, {id: id});
    var val = p.print;
    _.set(_.find(persons, {id: id}), 'print', !val);
    // Update person
    sessionStorage.setItem(storage_name,JSON.stringify(persons));
    //routie("list");
    routie.navigate("list");
}*/

let save_updated = () => {
    let updated = JSON.parse(sessionStorage.getItem(storage_name+"_updated"));
    var workbook = XLSX.utils.book_new();
    //wb.SheetNames.push("Medlemmar för MC");
    var worksheet = XLSX.utils.json_to_sheet(updated, {});
    XLSX.utils.book_append_sheet(workbook, worksheet, "NewOrUpdated");
    XLSX.writeFile(workbook, "NewOrUpdated.xlsx", {});
}

let save_deleted = () => {
    let updated = JSON.parse(sessionStorage.getItem(storage_name+"_deleted"));
    var workbook = XLSX.utils.book_new();
    var worksheet = XLSX.utils.json_to_sheet(updated, {});
    XLSX.utils.book_append_sheet(workbook, worksheet, "Deleted");
    XLSX.writeFile(workbook, "Deleted.xlsx", {});
}

let saveReportToFile = () => {
    var wb = XLSX.utils.book_new();
    wb.SheetNames.push("Medlemmar för MC");

    var ws_data = [];
    document.querySelectorAll("#pageBody .person").forEach((p) => {
        let id = p.querySelector("a").id;
        let name = p.querySelector(".name").innerText;
        //console.log("name: ", name);
        let address = p.querySelector(".streetaddress").innerText;
        let print = $(p).hasClass("bg-success-light")?"Utskriven":"Ej utskriven";
        let noPaper = p.querySelector(".float-end > div:nth-of-type(1)")?_.trim(p.querySelector(".float-end > div:nth-of-type(1)").innerText):'';
        let familyHead = p.querySelector(".float-end > div:nth-of-type(2)")?_.trim(p.querySelector(".float-end > div:nth-of-type(2)").innerText):'';
        let familyMember = p.querySelector(".float-end > div:nth-of-type(3)")?_.trim(p.querySelector(".float-end > div:nth-of-type(3)").innerText):'';
        let householdHead = p.querySelector(".float-end > div:nth-of-type(4)")?_.trim(p.querySelector(".float-end > div:nth-of-type(4)").innerText):'';
        let householdMember = p.querySelector(".float-end > div:nth-of-type(5)")?_.trim(p.querySelector(".float-end > div:nth-of-type(5)").innerText):'';
        ws_data.push([id, name, address, print, noPaper, familyHead, familyMember, householdHead, householdMember]);
    })
    //console.log(ws_data);
    wb.Sheets["Medlemmar för MC"] = XLSX.utils.aoa_to_sheet(ws_data);

    // Save to file
    XLSX.writeFile(wb, "Export_IO_till_MC.xlsx", {});
    routie.navigate("#");
}

let markIngenTidning = (person) => {
    //let noPaper = _.map(_.split(o.groups, ','), _.trim).includes('MC_IngenTidning');
    if(_.map(_.split(person.groups, ','), _.trim).includes('MC_IngenTidning')) {
        person.print = false;
        person.nopaper = 'MC_IngenTidning';
    };
    return person;
}

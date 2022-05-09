'use strict';

// Settings
const storage_name = 'sfk-io-to-mc'; // Core prefix for storing data locally in browser

let year = new Date().getFullYear();
let age = (birthDate) => {
    return (year - birthDate.substring(0,4)) + " år";
}

/** For updating part of HTML page using javascript template fragment - see index.html */
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

/** Read/import Exfel file of member data. Generic to handle both IO and MC exports  */
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

    // Save result
    sessionStorage.setItem(storage_id, JSON.stringify(persons));
};

/** Importing Excel file */
let importFile = async (form_id, storage_id) => {
    let importPromise = new Promise((resolve) => {
        let fileUpload = document.getElementById(form_id);

        let regex = /^([a-zA-Z0-9\s_\\.-:]).+(.xls|.xlsx|.xlsb)$/;
        if (regex.test(fileUpload.value.toLowerCase())) {
            if (typeof (FileReader) != "undefined") {
                let reader = new FileReader();
                    //For Browsers other than IE.
                    if (reader.readAsBinaryString) {
                        reader.onload = function (e) {
                            processExcel(e.target.result, storage_id);
                            resolve();
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
                            resolve();
                        };
                        reader.readAsArrayBuffer(fileUpload.files[0]);
                    }
            } else {
                alert("Den här webbläsaren har inte stöd för HTML5 - vilket är ett krav");
            }
        } else {
            alert("Vald fil är ogiltig!");
        }
    });

    let result = await importPromise;
}


/** Importing Excel file */
function import_file(form_id, storage_id) {
    console.log("import_file")
    let fileUpload = document.getElementById(form_id);

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
    // My Club does not export last 4 digits in Personnummer - so we need to make a work around to be more sure
    // Challenges: Misspellings => problem
    return _.trim(fname.replaceAll(" ","__")).toLocaleLowerCase() +"_"+ _.trim(lname.replaceAll(" ","__")).toLocaleLowerCase() +"_"+ id.substring(0,8);
    //return id.substring(0,8);
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

/** Make comparison between IO and MC and try to determine "new/updated" vs "deleted" */
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
            deleted.push(_.merge(_.pick(p, ['Personnummer','Förnamn','Efternamn','Adress','E-post']), {'Grupperingar':"ToBeRemoved"}));
        } else {
            // New or updated
            updated.push({
                'Personnummer':io_person["Födelsedat./Personnr. (ååååmmdd-xxxx)"].replaceAll("-",""),
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
                'Grupperingar':"ChangesAndAdditions",
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

/** Get new and updated members by diff IO vs MC */
let get_updated = (io_persons, mc_persons) => {
    identify_and_store_diff(io_persons, mc_persons);
    return JSON.parse(sessionStorage.getItem(storage_name+"_updated"));
}
/** Get "deleted" members by diff IO vs MC */
let get_deleted = (io_persons, mc_persons) => {
    identify_and_store_diff(io_persons, mc_persons);
    return JSON.parse(sessionStorage.getItem(storage_name+"_deleted"));
}

/** Export new or updated members to Excel file */
let save_updated = () => {
    let updated = JSON.parse(sessionStorage.getItem(storage_name+"_updated"));
    var workbook = XLSX.utils.book_new();
    //wb.SheetNames.push("Medlemmar för MC");
    var worksheet = XLSX.utils.json_to_sheet(updated, {});
    XLSX.utils.book_append_sheet(workbook, worksheet, "ChangesAndAdditions");
    XLSX.writeFile(workbook, "ChangesAndAdditions.xlsx", {});
}

/** Export "deleted" members to Excel file */
let save_deleted = () => {
    let updated = JSON.parse(sessionStorage.getItem(storage_name+"_deleted"));
    var workbook = XLSX.utils.book_new();
    var worksheet = XLSX.utils.json_to_sheet(updated, {});
    XLSX.utils.book_append_sheet(workbook, worksheet, "ToBeRemoved");
    XLSX.writeFile(workbook, "ToBeRemoved.xlsx", {});
}

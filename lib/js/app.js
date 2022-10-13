'use strict';

// Settings
const storage_name = 'sfk-io-to-mc'; // Core prefix for storing data locally in browser
const no_alcohol_age = 18

let year = new Date().getFullYear();
let age = (birthDate) => {
    return (year - birthDate.substring(0,4)) + " år";
}

Date.prototype.toLocalISOString = function() {
    let offsetMins = this.getTimezoneOffset();
    let localTimeMs = this - offsetMins * 6e4;
    let date = new Date(localTimeMs);
    let utcOffsetSign = offsetMins > 0? '-' : '+';
    offsetMins = Math.abs(offsetMins);
    let utcOffsetHr = String(offsetMins / 60 | 0).padStart(2,'0');
    let utcOffsetMin = String(offsetMins % 60).padStart(2,'0');
    let utcOffsetString = `${utcOffsetSign}${utcOffsetHr}:${utcOffsetMin}`;
    return date.toISOString().replace('Z', utcOffsetString);
}

let getDate = (date = null) => {
    var currentDate = date ? new Date(date) : new Date();
    //return `${currentDate.toLocalISOString().substring(0,10)}`;
    return `${currentDate.toLocalISOString().substring(2,10).replaceAll("-","")}`;
}

let getShortTimestamp = (date = null) => {
    var currentDate = date ? new Date(date) : new Date();
    var local = currentDate.toLocalISOString();
    var date = getDate();
    return date + "_" + local.substring(11,16).replaceAll(":",".");
}
let getTimestamp = (date = null) => {
    var currentDate = date ? new Date(date) : new Date();
    return currentDate.toLocalISOString();
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

/** Read/import Excel file of member data. Generic to handle both IO and MC exports  */
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

// 19730319-xxxx   13
// 730319-xxxx     11
// 730319xxxx      10
// 1973-03-19      10
// 73-03-19         8
// 730319           6
let convert_to_date = (io_value) => {
	let number = io_value.trim();
	if (number.length == 13 && number[8] == '-')
	    return number.substring(0,4) + '-' + number.substring(4,6) + '-' + number.substring(6,8);
	return "Error"
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

let convertPostnummer = (io_value) => {
    return io_value.replaceAll("-","").replaceAll(" ","");
}

let in_sport = (io_person, sport) => {
	if (io_person["Roller"].search("Aktiv - " + sport) != -1)
		return true;
	else
		return false;
}

let in_group = (io_person, group) => {
	if (io_person["Grupp/Lag/Arbetsrum/Familj"].search(group) != -1)
		return true;
	else
		return false;
}

let process_members = (io_persons, io_fees_payed, io_fees_sent, io_fees_overdue) => {
    let members = []; // Or new
    let feeNotSent = [];
	
    _.forEach(io_persons, function(io_person) {
        let io_fee_payed = _.find(io_fees_payed, function(f) { return f["IdrottsID"] == io_person["IdrottsID"]; });
        let io_fee_sent = _.find(io_fees_sent, function(f) { return f["IdrottsID"] == io_person["IdrottsID"]; });
        let io_fee_overdue = _.find(io_fees_overdue, function(f) { return f["IdrottsID"] == io_person["IdrottsID"]; });
	if (_.isEmpty(io_fee_payed) &&
		_.isEmpty(io_fee_sent) &&
		_.isEmpty(io_fee_overdue) &&
		io_person["Medlem t.o.m."] != "Ständig medlem" &&
		io_person["Typ"] != "P" &&
		io_person["Målsman"] == "") {
            // Person has not received fee
            feeNotSent.push({
				'Prova-på':"",
				'Förnamn':io_person["Förnamn"],
				'Alt. förnamn':"",
				'Efternamn':io_person["Efternamn"],
				'Kön':"",
				'Nationalitet':"",
				'IdrottsID':io_person["IdrottsID"],
				'Födelsedat./Personnr. (ååååmmdd-xxxx)':io_person["Födelsedat./Personnr. (ååååmmdd-xxxx)"],
				'Telefon mobil':"",
				'E-post kontakt':"",
				'Kontaktadress - c/o adress':"",
				'Kontaktadress - Gatuadress':"",
				'Kontaktadress - Postnummer':"",
				'Kontaktadress - Postort':"",
				'Kontaktadress - Land':"",
				'Arbetsadress - c/o adress':"",
				'Arbetsadress - Gatuadress':"",
				'Arbetsadress - Postnummer':"",
				'Arbetsadress - Postort':"",
				'Arbetsadress - Land':"",
				'Telefon bostad':"",
				'Telefon arbete':"",
				'E-post privat':"",
				'E-post arbete':"",
				'Medlemsnr.':"",
				'Medlem sedan':"",
				'Medlem t.o.m.':"",
				'Övrig medlemsinfo':"",
			});
		}

		if (io_person["Målsman"] == "") {
			let phonenumber = io_person["Telefon mobil"];
			if (phonenumber == "") phonenumber = io_person["Telefon bostad"];
			
			let membershipfee = 'Inte utskickad'
			if (io_person["Medlem t.o.m."] == "Ständig medlem") membershipfee = 'Hedersmedlem';
			else if (io_person["Typ"] == "P") membershipfee = 'Prova-på';
			else if (!_.isEmpty(io_fee_payed)) membershipfee = 'Betald';
			else if (!_.isEmpty(io_fee_sent)) membershipfee = 'Utskickad';
			else if (!_.isEmpty(io_fee_overdue)) membershipfee = 'Försenad';

			// All members with better formatting
			members.push({
				'Förnamn': io_person["Förnamn"], 
				'Efternamn':io_person["Efternamn"], 
				'Födelsedat.':convert_to_date(io_person["Födelsedat./Personnr. (ååååmmdd-xxxx)"]),
				'Medlemsavgift':membershipfee,
				'Telefon':phonenumber,
				'E-post':io_person['E-post kontakt'],
				'c/o':io_person["Folkbokföring - c/o adress"], 
				'Adress':io_person["Folkbokföring - Gatuadress"], 
				'Postnummer':convertPostnummer(io_person["Folkbokföring - Postnummer"]), 
				'Postort':io_person["Folkbokföring - Postort"], 
				'Familj':io_person["Familj"],
				'Orientering':in_sport(io_person,"Orientering")?"X":"",
				'Fotboll':in_sport(io_person,"Fotboll")?"X":"",
				'Mountainbike':in_sport(io_person,"Cykel")?"X":"",
				'Skidor':in_sport(io_person,"Skidor")?"X":"",
				'Volleyboll':in_sport(io_person,"Volleyboll")?"X":"",
				'Sacro':in_sport(io_person,"Gymnastik")?"X":"",
				'Chillskate':in_sport(io_person,"Scateboard")?"X":"",
				'Senior':in_group(io_person,"SFK Senior")?"X":"",
			});
		}
    });
    sessionStorage.setItem(storage_name+"_members", JSON.stringify(members));
    sessionStorage.setItem(storage_name+"_feeNotSent", JSON.stringify(feeNotSent));
}

/** Make comparison between IO and MC and try to determine "new/updated" vs "deleted" */
let identify_and_store_diff = (io_persons, mc_persons) => {
	_.forEach(io_persons, function(io_person) {
		io_person.complete_address = _.trim(io_person["Folkbokföring - Gatuadress"]) + "_" + _.trim(convertPostnummer(io_person["Folkbokföring - Postnummer"]));
		io_person.birthdate = Number(io_person["Födelsedat./Personnr. (ååååmmdd-xxxx)"].replaceAll("-","").substring(0,8))
	})

	io_persons.sort(function (a,b) { return a.birthdate - b.birthdate;});

    let mc_import = [];
    _.forEach(io_persons, function(io_person) {
		if (io_person["Typ"] != "P" && io_person["Målsman"] == "" && io_person["Födelsedat./Personnr. (ååååmmdd-xxxx)"].length == 13) {
		
			// Magazine
			// The magazine will be sent to the oldest member at every address, unless the oldest 
			// member at the address is included in the group "SFF Ingen Tidning". It will also be 
			// sent to members that are included in the group "SFF Tidning". 
			let oldest_at_address = _.find(io_persons, function(p) { return p.complete_address == io_person.complete_address; });
			if (  (oldest_at_address["Födelsedat./Personnr. (ååååmmdd-xxxx)"] == io_person["Födelsedat./Personnr. (ååååmmdd-xxxx)"] && 
			       !in_group(io_person, "SFF Ingen Tidning") ) || in_group(io_person, "SFF Tidning")) {
				io_person.no_magazine = "Nej";
			} else {
				io_person.no_magazine = "Ja";
			}
			// Honormember
			if(io_person["Medlem t.o.m."] == "Ständig medlem") {
				io_person.honormember = "Ja";
			} else {
				io_person.honormember = "Nej";
			}
			
			// Frisksportlöfte
			// All members younger than no_alcohol_age years will be selected, as well as those in the group "SFF Frisksportlöfte"
			//if ((Number("20"+getDate()) - io_person.birthdate < no_alcohol_age * 10000) || in_group(io_person, "SFF Frisksportlöfte")) {
			if (in_group(io_person, "SFF Frisksportlöfte")) {
				io_person.no_alcohol_vow = "Ja";
			} else {
				io_person.no_alcohol_vow = "Nej";
			}				
			
			let first = true;
			io_person.groups = ""
			if (in_sport(io_person,"Orientering")) {
				io_person.groups += (first ? "" : ",") + "Orientering";
				first = false;
			}
			if (in_sport(io_person,"Fotboll")) {
				io_person.groups += (first ? "" : ",") + "Fotboll";
				first = false;
			}
			if (in_sport(io_person,"Cykel")) {
				io_person.groups += (first ? "" : ",") + "MTB";
				first = false;
			}
			if (in_sport(io_person,"Skidor")) {
				io_person.groups += (first ? "" : ",") + "Skidor";
				first = false;
			}
			if (in_sport(io_person,"Volleyboll")) {
				io_person.groups += (first ? "" : ",") + "Volleyboll";
				first = false;
			}
			if (in_sport(io_person,"Gymnastik")) {
				io_person.groups += (first ? "" : ",") + "Trampolin (SACRO)";
				first = false;
			}
			if (in_sport(io_person,"Skateboard")) {
				io_person.groups += (first ? "" : ",") + "Skateboard (Chillskate)";
				first = false;
			}
			if (in_group(io_person,"SFK Senior")) {
				io_person.groups += (first ? "" : ",") + "Senior";
				first = false;
			}
			if (in_group(io_person,"SFK Huvudsektion")) {
				io_person.groups += (first ? "" : ",") + "Huvudsektion";
				first = false;
			}
            mc_import.push({
                'Personnummer':io_person["Födelsedat./Personnr. (ååååmmdd-xxxx)"].replaceAll("-",""),
                'Förnamn': io_person["Förnamn"], 
                'Efternamn':io_person["Efternamn"], 
                'Kön': convertSex(io_person["Kön"]), 
                'c/o':io_person["Folkbokföring - c/o adress"], 
                'Adress':io_person["Folkbokföring - Gatuadress"], 
                'Postnummer':convertPostnummer(io_person["Folkbokföring - Postnummer"]), 
                'Postort':io_person["Folkbokföring - Postort"], 
                'Hemtelefon':io_person["Telefon bostad"], 
                'Arbetstelefon':io_person["Telefon arbete"],
                'Mobiltelefon':io_person["Telefon mobil"],
                'E-post':io_person['E-post kontakt'],
				'Ingen tidning tack':io_person.no_magazine,
				'Frisksportlöfte':io_person.no_alcohol_vow,
				'Hedersmedlem':io_person.honormember,
                'Grupp':io_person.groups,
            });
		}
	});

    _.forEach(mc_persons, function(mc_person) {
        let io_person = _.find(io_persons, function(p) { return p["Födelsedat./Personnr. (ååååmmdd-xxxx)"].replaceAll("-","") == mc_person["Personnummer"]; });
        if(_.isEmpty(io_person)) {
            // Person to be deleted
            mc_import.push(_.merge(_.pick(mc_person, ['Personnummer','Förnamn','Efternamn']), 
			                       {'Kön':mc_person["Kön (W/M)"]}, 
								   _.pick(mc_person, ['c/o','Adress','Postnummer','Postort','Hemtelefon','Arbetstelefon','Mobiltelefon','E-post','Ingen tidning tack','Frisksportlöfte','Hedersmedlem']), 
								   {'Grupp':"Remove"}));
        }
    });
	//console.log(mc_output);
    sessionStorage.setItem(storage_name+"_mc_import", JSON.stringify(mc_import));
}

let get_members = (io_persons, io_fees_payed, io_fees_sent, io_fees_overdue) => {
	process_members(io_persons, io_fees_payed, io_fees_sent, io_fees_overdue);
    return JSON.parse(sessionStorage.getItem(storage_name+"_members"));
}

let get_fees_not_sent = (io_persons, io_fees_payed, io_fees_sent, io_fees_overdue) => {
	process_members(io_persons, io_fees_payed, io_fees_sent, io_fees_overdue);
    return JSON.parse(sessionStorage.getItem(storage_name+"_feeNotSent"));
}


/** Get new and updated members by diff IO vs MC */
let get_myclub_import = (io_persons, mc_persons) => {
    identify_and_store_diff(io_persons, mc_persons);
    return JSON.parse(sessionStorage.getItem(storage_name+"_mc_import"));
}

let save_members = () => {
    let list = JSON.parse(sessionStorage.getItem(storage_name+"_members"));
    var workbook = XLSX.utils.book_new();
    //wb.SheetNames.push("Medlemmar för MC");
    var worksheet = XLSX.utils.json_to_sheet(list, {});
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "Members_"+getShortTimestamp()+".xlsx", {});
}
let save_feeNotSent = () => {
    let list = JSON.parse(sessionStorage.getItem(storage_name+"_feeNotSent"));
    var workbook = XLSX.utils.book_new();
    var worksheet = XLSX.utils.json_to_sheet(list, {});
    XLSX.utils.book_append_sheet(workbook, worksheet, "FeeNotSent");
    XLSX.writeFile(workbook, "FeeNotSent_"+getShortTimestamp()+".xlsx", {});
}

/** Export new or updated members to Excel file */
let save_myclub_import = () => {
    let mc_import = JSON.parse(sessionStorage.getItem(storage_name+"_mc_import"));
    var workbook = XLSX.utils.book_new();
    //wb.SheetNames.push("Medlemmar för MC");
    var worksheet = XLSX.utils.json_to_sheet(mc_import, {});
    XLSX.utils.book_append_sheet(workbook, worksheet, "MyClub");
    XLSX.writeFile(workbook, "MyClub_import_"+getShortTimestamp()+".xlsx", {});
}


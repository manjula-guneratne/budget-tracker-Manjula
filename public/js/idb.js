// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'pizza_hunt' and set it to version 1
const request = indexedDB.open('index_offline',1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event){
    //save a reference to the database
    const db = event.target.result;
    // create an object store (table) called `new_pizza`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_index', { autoIncrement: true});
};

//upon a successful
request.onsuccess = function(event){
    // when db is successfully created with its object store (from onupgradedneeded event above) or 
    // simply established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run uploadPizza() function to send all local db data to api
  if(navigator.onLine){
      uploadData();
  }
};

request.onerror = function(event){
    //log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record){
    //open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_index'], 'readwrite');

    //access the object store for `new_pizza`
    const itemObjectStore = transaction.objectStore('new_index');

    //add record to your store with add method
    itemObjectStore.add(record);
}

function uploadData(){
    //open a transaction on your db
    const transaction = db.transaction(['new_index'],'readwrite');

    //access your object store
    const itemObjectStore = transaction.objectStore('new_index');

    //get all records from the store and set it to a variable
    const getAll = itemObjectStore.getAll();

    //upon a successful .getAll() execution...
    getAll.onsuccess = function(){
        //if there was data in indexDB's store, let's send it to the api server
        if(getAll.result.length > 0){
            fetch('/api/transaction',{
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers:{
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type':'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message){
                    throw new Error(serverResponse);
                }

                //open one more transaction
                const transaction  = db.transaction(['new_index'],'readwrite');
                //access the new_index object store
                const itemObjectStore = transaction.objectStore('new_index');
                //clear all items in your store
                itemObjectStore.clear();

                alert('All saved transactions has been submitted');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadData);
function save_options() 
{
  var input = document.getElementById("numsearches");
  var numSearches = input.value;
  localStorage["num_searches"] = numSearches;

  input = document.getElementById("nummobilesearches");
  var numMobileSearches = input.value;
  localStorage["num_mobile_searches"] = numMobileSearches;

  input = document.getElementById("delaytime");
  var delayTime = input.value;
  localStorage["delay_time"] = delayTime;

  input = document.getElementById("autosearch");
  var autoSearch = input.value;
  localStorage["auto_search"] = autoSearch;

  input = document.getElementById("searchhour");
  var searchHour = input.value;
  localStorage["search_hour"] = searchHour;

  input = document.getElementById("searchminute");
  var searchMinute = input.value;
  localStorage["search_minute"] = searchMinute;

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}

// Restores select box state to saved value from localStorage.
function restore_options() 
{
  var numSearches = localStorage["num_searches"];
  var numMobileSearches = localStorage["num_mobile_searches"];
  var delayTime = localStorage["delay_time"];
  var autoSearch = localStorage["auto_search"];
  var searchHour = localStorage["search_hour"];
  var searchMinute = localStorage["search_minute"];

  var input = document.getElementById("numsearches");
  input.value = numSearches;
  input = document.getElementById("nummobilesearches");
  input.value = numMobileSearches;
  input = document.getElementById("delaytime");
  input.value = delayTime;
  input = document.getElementById("autosearch");
  input.value = autoSearch;
  input = document.getElementById("searchhour");
  input.value = searchHour;
  input = document.getElementById("searchminute");
  input.value = searchMinute;
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
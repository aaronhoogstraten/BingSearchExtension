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
  if (!numSearches || !numMobileSearches || !delayTime) 
    return;

  var input = document.getElementById("numsearches");
  input.value = numSearches;
  input = document.getElementById("nummobilesearches");
  input.value = numMobileSearches;
  input = document.getElementById("delaytime");
  input.value = delayTime;
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
var timer;
var stop = 0; 
var wndId ;
var wnd;
var delayTime = 1500;
var numSearches = 30;
var numMobileSearches = 20;
var numMaxOpenTabs = 1; 
var resetSearches = numSearches;
var bIsMobileSearching = false;
var MobileTabId = -1;
var bEnableAutoSearch = false;

chrome.browserAction.onClicked.addListener(function(tab) {
	HandleClick();
});

chrome.runtime.onStartup.addListener(function(){
	CheckTimeStampForAutoSearch();
});


chrome.runtime.onInstalled.addListener(function(details){
	CheckTimeStampForAutoSearch();
});

function CheckTimeStampForAutoSearch()
{
	//Sanitize user input if needed;
	if(localStorage["auto_search"] > 1)
		localStorage["auto_search"] = 1;
	else if(localStorage["auto_search"] < 0)
		localStorage["auto_search"] = 0;

	bEnableAutoSearch = localStorage["auto_search"];

	if(bEnableAutoSearch == false)
		return;

	var lastTimeStamp = localStorage["last_timestamp"];
	var CurrentDate = new Date();
	var currentTimeStamp = CurrentDate.getTime();
	
	//No previous timestamp saved
	if(isNaN(lastTimeStamp))
	{
		localStorage["last_timestamp"] = currentTimeStamp;
		InitNewSearches();
	}
	else //Check if we have done searches today
	{
		//Sanitize user input if needed
		if(localStorage["search_hour"] > 23)
			localStorage["search_hour"] = 23;
		else if(localStorage["search_hour"] < -1)
			localStorage["search_hour"] = -1;

		if(localStorage["search_minute"] > 59)
			localStorage["search_minute"] = 59;
		else if(localStorage["search_minute"] < -1)
			localStorage["search_minute"] = -1;

		var TargetHour = localStorage["search_hour"];
		var TargetMinutes = localStorage["search_minute"];
		var LastDate = new Date(+lastTimeStamp);
		var timeLeft = 0;

		var bDidSearchToday = LastDate.getDate() == CurrentDate.getDate(); //Assume the user won't wait to open Chrome until the same date next month... or year...
		var bUseTargetTime = TargetHour > -1 && TargetMinutes > -1;

		if(!bDidSearchToday)
		{
			if(bUseTargetTime)
			{
				if(CurrentDate.getHours() >= TargetHour && CurrentDate.getMinutes() >= TargetMinutes)
					InitNewSearches();
				else
					timeLeft = (new Date(CurrentDate.getFullYear(), CurrentDate.getMonth(), CurrentDate.getDate(), TargetHour, TargetMinutes, 0, 0)).getTime() - currentTimeStamp; //Wait until the target time to try again
			}
			else
			{
				InitNewSearches();
			}
		}
		else
		{
			var waitHour = TargetHour > -1 ? TargetHour : 0;
			var waitMinute = TargetMinutes > -1 ? TargetMinutes: 0;
			timeLeft = (new Date(CurrentDate.getFullYear(), CurrentDate.getMonth(), CurrentDate.getDate()+1, waitHour, waitMinute, 0, 0)).getTime() - currentTimeStamp; //Wait until the next day
		}

		if(timeLeft > 0)
			timer = setInterval(CheckTimeStampForAutoSearch, timeLeft); //Check again at the end of the remaining time to the next day
	}
}

function InitNewSearches()
{
	numSearches = 0;	
	stop = 0;
	HandleClick();
}

function HandleClick()
{
	delayTime = localStorage["delay_time"]*1000;

	if(isNaN(delayTime))
		delayTime = 1500; //default

	if(numSearches == 0)
	{
		stop = 0;
	}

	if(stop == 0) //Start
	{
		clearInterval(timer);
		localStorage["last_timestamp"] = (new Date()).getTime();	//Save the current timestamp at the beginning of searches

		stop = 1;
		numSearches = localStorage["num_searches"];
		if(isNaN(numSearches))
			numSearches = 30; //default

		numMobileSearches = localStorage["num_mobile_searches"];
		if(isNaN(numMobileSearches))
			numMobileSearches = 20; //default

		//Do first search when window opened
		var searchURL = GenerateSearchURL();

		numSearches--;
		chrome.windows.create({'url': searchURL, 'focused': false}, function(win){
				wndId = win.id;
				wnd = win;
				chrome.windows.update(win.id, {'top': 0, 'left': 0, 'width': screen.availWidth});
				chrome.windows.update(win.id, {'state': "minimized"});
		});


		StartSearches();
	}
	else if(stop == 1) //Pause
	{
		stop = 2;
		clearInterval(timer);
	}
	else if(stop == 2) //Resume
	{
		if(!bIsMobileSearching)
			StartSearches();
		else
			StartMobileSearches();

		stop = 1;
	}
}

function StartSearches()
{
	timer = setInterval(CreateTabs, delayTime); 
}

function CreateTabs()
{
	//One search has already been performed on window open
	if(numSearches>0)
	{
		//Close all completed searches at the max number tab threshold
		chrome.tabs.query({windowId:wndId}, function(tabs)
        {
        	if(tabs.length >= numMaxOpenTabs)
        	{
	            for (i in tabs)
	            {
	            	if(tabs[i].status == "complete")
	            	{
	            		chrome.tabs.remove(tabs[i].id);
	            	}
	            }
	        }
        });

		var searchURL = GenerateSearchURL();
		chrome.tabs.create({url:searchURL, windowId:wndId, active:false});
		numSearches--;
	}
	else //Finished regular searches
	{
		clearInterval(timer);
		InitMobileSearches();
	}
	
}

function UpdateMobileTab()
{
	if(numSearches>0)
	{
		//We update a single tab so we only have to attach the debugger once
		chrome.tabs.get(MobileTabId, function(tab)
		{
			if(tab.status == "complete")
			{
				var searchURL = GenerateSearchURL();
				chrome.tabs.update(MobileTabId, {url:searchURL, active:false});
				numSearches--;
			}

		});
	}
	else //Finished mobiles searches
	{
		//Reload the whole extension to make sure the states get reset properly
		chrome.runtime.reload();
		//MobileTabId = -1;
		//bIsMobileSearching = false;
		//clearInterval(timer);
		//CheckTimeStampForAutoSearch(); //start checking for next autosearch
	}
}

function StartMobileSearches()
{
	timer = setInterval(UpdateMobileTab, delayTime);
}

function InitMobileSearches()
{
	clearInterval(timer);

	bIsMobileSearching = true;

	chrome.tabs.query({windowId:wndId}, function(tabs)
    {
        for (i in tabs)
        {
        	if(tabs[i].status == "complete")
        	{
        		MobileTabId = tabs[i].id;
        		break;
        	}
        }
    });

	if(MobileTabId < 0)
	{
		timer = setInterval(InitMobileSearches, 0.5);
	}
	else
	{
		SpoofUserAgentToMobile(MobileTabId);
		numSearches = numMobileSearches;
	}
}

function GenerateSearchURL()
{
	var searchURL = "http://www.bing.com/search?q=";
	var alphabet ="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	
	for(j=0;j<4;j++)
	{
		searchURL = searchURL + alphabet.charAt(Math.floor(Math.random() * alphabet.length));
	}

	return searchURL;
}

function SpoofUserAgentToMobile()
{
//http://stackoverflow.com/questions/15618923/in-google-chrome-what-is-the-extension-api-for-changing-the-useragent-and-devic
	// 1. Attach the debugger
	var protocolVersion = '1.0';
	chrome.debugger.attach({tabId:MobileTabId}, protocolVersion, function() {
	    if (chrome.runtime.lastError) {
	        console.log(chrome.runtime.lastError.message);
	        return;
	    }
	    // 2. Debugger attached, now prepare for modifying the UA
	    chrome.debugger.sendCommand({
	        tabId:MobileTabId
	    }, "Network.enable", {}, function(response) {
	    	  if (chrome.runtime.lastError)
	        	console.log(chrome.runtime.lastError.message);
	        // Possible response: response.id / response.error
	        // 3. Change the User Agent string!
	        chrome.debugger.sendCommand({
	            tabId:MobileTabId
	        }, "Network.setUserAgentOverride", {
	            userAgent:"Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19"
	        }, function(response) {
	        	if (chrome.runtime.lastError)
	       			 console.log(chrome.runtime.lastError.message);
	            // Possible response: response.id / response.error
	            // 4. Now detach the debugger (this restores the UA string).
	            //chrome.debugger.detach({tabId:MobileTabId});
	            StartMobileSearches();
	        });
	    });
	});	
}
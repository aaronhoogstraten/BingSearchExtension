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


chrome.browserAction.onClicked.addListener(function(tab) {
	
	delayTime = localStorage["delay_time"]*1000;
	
	if(isNaN(delayTime))
		delayTime = 1500; //default

	if(numSearches == 0)
	{
		stop = 0;
	}

	if(stop == 0) //Start
	{
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
	
});


function StartSearches()
{
	//alert(wndId);
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
	else
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
	else
	{
		clearInterval(timer);
	}
}

function StartMobileSearches()
{
	alert("StartMobileSearches");
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

	if(MobileTabId == -1)
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
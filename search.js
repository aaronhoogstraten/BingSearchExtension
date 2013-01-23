var timer;
var stop = 0; 
var wndId ;
var wnd;
var delayTime = 1500;
var numSearches = 30;
var numMaxOpenTabs = 1; 
var resetSearches = numSearches;

chrome.browserAction.onClicked.addListener(function(tab) {
	delayTime = localStorage["delay_time"]*1000;
	if(isNaN(delayTime))
		delayTime = 1500; //default

	if(numSearches == 0)
	{
		stop = 0;
	}

	if(stop == 0)
	{
		stop = 1;
		numSearches = localStorage["num_searches"]
		if(isNaN(numSearches))
			numSearches = 30; //default

		//Do first search when window opened
		var searchURL = GenerateSearchURL();

		numSearches--;
		chrome.windows.create({'url':searchURL, 'focused':false},function(win){
				wndId = win.id;
				wnd = win;
				chrome.windows.update(win.id, {'state': "minimized"});
		});
		StartSearches();
	
	}
	else if(stop == 1)
	{
		stop = 2;
		clearInterval(timer);
	}
	else if(stop == 2)
	{
		StartSearches();
		stop = 1;
	}
	
});


function StartSearches()
{
	//alert(wndId);
	timer = setInterval(CreateTabs,delayTime); 
}

function CreateTabs()
{
	//One search has already been performed on window open
	if(numSearches>0)
	{
		//Close all completed searches at the max number tab threshold
		chrome.tabs.getAllInWindow(wndId, function(tabs)
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
		chrome.tabs.create({url:searchURL, windowId:wndId});
		numSearches--;
	}
	else
	{
		clearInterval(timer);
	}
	
}

function GenerateSearchURL()
{
	var searchURL = "http://www.bing.com/search?q=";
	
	for(j=0;j<4;j++)
	{
		var rnd=Math.floor(Math.random()*(90-65))+66;
		searchURL = searchURL + String.fromCharCode(rnd);
	}

	return searchURL;
}
var timer;
var stop = 0; 
var wndId ;
var wnd;
var numSearches = 93;
var numMaxOpenTabs = 1; 
var resetSearches = numSearches;

chrome.browserAction.onClicked.addListener(function(tab) {
	
	if(numSearches == 0)
	{
		stop = 0;
		numSearches = resetSearches;
	}

	if(stop == 0)
	{
		stop = 1;
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
	timer = setInterval(CreateTabs,1500); 
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
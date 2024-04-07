

// custom functions to load and save cookies, and also uses "local storage" if available
// possibly not needed if we use django

function getCookie(c_name)
{
    if(typeof localStorage != "undefined")
    {
        return localStorage.getItem(c_name);
    }
    else
    {
        var c_start = document.cookie.indexOf(c_name + "=");
        if (document.cookie.length > 0)
        {
            if (c_start !== -1)
            {
                return getCookieSubstring(c_start, c_name);
            }
        }
        return "";
    }
}

function setCookie(c_name, value, expiredays)
{
    expiredays= expiredays || 30;
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + expiredays);
    if(typeof localStorage != "undefined")
    {
        localStorage.setItem(c_name, value);
    }
    else
    {
        document.cookie = c_name + "=" + escape(value) +
        ((expiredays === null) ? "" : ";expires=" + exdate.toUTCString());
    }
}
	


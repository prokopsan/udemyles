/* This opens a layer, when the user tries to submit the page but did not accept the t&c
  * the layer contains 2 buttons:
  * 1) confirm button accepts the t&c and submits
  * 2) skip button submits the form */
var Optin_layer = function (options) {
   var self = this;
   var _defaults = {
      layer_id: 'optin_layer',
      hide_class: 'hidden',
      confirm_button_id: 'optin_confirm_button',
      skip_button_id: 'optin_skip_button',
      form_id: 'form_reg_half',
      checkbox_1_id: 'agb',
      checkbox_2_id: 'agb2',
      both_checkbox_id: 'both_agb_checkbox'
   };
   var _options = {};

   var init = function (options) {
      _options = (typeof options !== 'object') ? _defaults : Object.merge(_defaults, options);

      if (typeof $(_options.layer_id) === null) {
         return;
      }

      add_events();
   };

   var add_events = function () {
      if ($(_options.confirm_button_id) !== null && $(_options.both_checkbox_id) !== null) {
         $$('#' + _options.confirm_button_id + ', #' + _options.both_checkbox_id).each(function (trigger) {
            $(trigger).addEvent('click', function () {
               if ($(_options.checkbox_1_id) !== null && $(_options.checkbox_2_id) !== null && $(_options.both_checkbox_id) !== null) {
                  $$('#' + _options.checkbox_1_id + ', #' + _options.checkbox_2_id + ', #' + _options.both_checkbox_id).each(function (checkbox) {
                     $(checkbox).set('checked', true);
                  });
                  disable_buttons();
                  save_log(self.submit_form);
               }
            });
         });
      }

      if ($(_options.skip_button_id) !== null) {
         $(_options.skip_button_id).addEvent('click', function () {
            disable_buttons();
            save_log(self.submit_form);
         });
      }
   };

   var disable_buttons = function () {
      $(_options.confirm_button_id).removeEvents();
      $(_options.skip_button_id).removeEvents();
      $(_options.both_checkbox_id).removeEvents();
      $(_options.both_checkbox_id).set('disabled', true);
      return;
   };

   var save_log = function (do_after_saving) {
      var ident = '';

      // none of the t&c checkboxes has been ticked
      if ($(_options.checkbox_1_id).checked === false && $(_options.checkbox_2_id).checked === false) {
         ident = 'optin_layer_consent_0';
      }

      // only the first t&c checkbox has been ticked
      if ($(_options.checkbox_1_id).checked === true && $(_options.checkbox_2_id).checked === false) {
         ident = 'optin_layer_consent_1';
      }

      // only the second t&c checkbox has been ticked
      if ($(_options.checkbox_1_id).checked === false && $(_options.checkbox_2_id).checked === true) {
         ident = 'optin_layer_consent_2';
      }

      // both t&c checkboxes have been ticked
      if ($(_options.checkbox_1_id).checked === true && $(_options.checkbox_2_id).checked === true) {
         ident = 'optin_layer_consent_after_layer';
      }

      new Request({
         'url': '/cgi-bin/global.pl?todo=log_misc&ident=' + ident,
         onComplete: function () {
            do_after_saving.attempt();
         }
      }).send();
   };

   self.submit_form = function () {
      if (page_submitted === false) {
         page_submitted = true;
         $(_options.form_id).submit();
      }
      return;
   };

   self.test_checkboxes = function () {
      var is_valid = false;
      if ($(_options.checkbox_1_id) !== null && $(_options.checkbox_2_id) !== null) {
         if ($(_options.checkbox_1_id).get('checked') === true && $(_options.checkbox_2_id).get('checked') === true) {
            is_valid = true;
         }
      }
      return is_valid;
   };

   self.show = function () {
      if (typeof $(_options.layer_id) !== null) {
         $(_options.layer_id).removeClass(_options.hide_class);
      }
      return;
   };

   self.hide = function () {
      if (typeof $(_options.layer_id) !== null) {
         $(_options.layer_id).removeClass(_options.hide_class);
      }
      return;
   };

   init(options);
};

//   ---------------------


CleverPush = window.CleverPush || [];

CleverPush.push(['getSubscriptionId', function (subscriptionId) {
   if (subscriptionId) {
      CP.subscriptionId = subscriptionId;
      CP.update_data();
   }
}]);

if (!window.CleverPush || !window.CleverPush.initialized) {
   window.cleverPushInitCallback = function (err) {
      if (err) {
         //console.error('Init callback error:', err);
      } else {
         CP.init();
      }
   };
} else {
   CP.init();
}

var CP = {
   page_name: "reg_half",
   is_page_1: "1",
   participation_pk: "",
   subscriptionId: null,
   debug: false,
   protect: false,

   init: function () {
      // => function to show optin
      if (CP.page_name === 'logout' || CP.is_page_1 === "1") { CleverPush.push(['triggerOptIn']); }
      // CleverPush Optin is Visible
      CleverPush.once('optInShown', function () {
         CP.debugger('optInShown');
         CP.log_misc_send('cleverpush_show');
         // allow button click
         var allow_button = document.getElementsByClassName('cleverpush-confirm-btn-allow')[0];
         allow_button.addEventListener('click', function () {
            CP.protect = true;
            CP.log_misc_send('cleverpush_first_click');
         });
      });

      // User click on x or body
      CleverPush.on('optInClosed', function () {
         CP.protect = false;
         CP.debugger('optInClosed');
         CP.log_misc_send('cleverpush_closed');
      });

      //user has subscribed
      CleverPush.once('subscribed', function () {
         CP.protect = false;
         CP.log_misc_send('cleverpush_final_optin');
         CleverPush.push(['getSubscriptionId', function (subscriptionId) {
            if (subscriptionId) {
               CP.subscriptionId = subscriptionId;
               CP.update_data();
            }
         }]);
         CP.debugger('subscribed');
      });
   },
   log_misc_send: function (ident) {
      if (CP.page_name != 'multicoreg') {
         var xhttp = new XMLHttpRequest();
         xhttp.open("GET", "/cgi-bin/global.pl?todo=log_misc&ident=" + ident, true);
         xhttp.send();
      }
   },
   update_data: function () {
      CP.debugger('check_request');
      if (CP.subscriptionId && CP.participation_pk.length && CP.is_page_1 != 1) {
         var xhttp = new XMLHttpRequest();
         xhttp.open("GET", "/sc/?cp=IPjWgmwmjgrgQgkrkkohnwhyurhtlOkkgwhGtqzxmgxsLtrrGXxqkoJwGyOiKzgygG&participation_pk=&email=&value=" + CP.subscriptionId, true);
         xhttp.send();
         CP.debugger('send_request');
      }
   },
   debugger: function (log) {
      if (CP.debug) {
         console.log(log);
      }
   }
};



//   ----------------------


var create_token_interval = 90000; // 1,5 mins
function token_generator() {
   grecaptcha.execute('6Lfvi4cUAAAAAG9KEALaSK9o9_tKD_RVK2a93fvU', { action: 'reg_half' })
      .then(function (token) {
         if (document.getElementById('v3_t')) {
            document.getElementById('v3_t').setAttribute('value', token);
         }
      });
}
function recaptchaCallBack() {
   grecaptcha.ready(function () {
      token_generator();
      setInterval(token_generator, create_token_interval)
   });
}


//   -----------------------

// polyfill Element.remove() function for IE
if (!('remove' in Element.prototype)) {
   Element.prototype.remove = function () {
      if (this.parentNode) {
         this.parentNode.removeChild(this);
      }
   };
}
document.addEventListener('DOMContentLoaded', function () {
   if (typeof user_device_type !== 'undefined') {
      var device_user_agent = (user_device_type.match('mobile|tablet') !== null) ? 'mobile' : 'desktop';
   } else {
      var device_user_agent = 'mobile';
   }

   // use 'debugMode = true' in console to active debugMode
   var debugMode = window.debugMode || sessionStorage.debugMode;

   var engage_layers = { "desktop_mouse_backwardsbutton": [{ "width": "750", "label": "", "src": "PGEgaHJlZj0iaHR0cHM6Ly93d3cuZ2lvcm5vZGlnbG9yaWEuY29tL3NjL1JNeWtqV2d6Z2tJZ21p\neUhpR0tIR2p3TXV3dW94aHdna25tb2lHWG9IaGlnd296S3dqTHRpa29rc3hobHlnd0p0anNrbXZo\ndmxpZ2tpd3Bzc2lLWGpHSlBQUnVOTklLUnVudFFNUHZ2dE1OUG1taW5pZ29vZ3JtUWdrcmxza1Nv\nd3BnbHBSem9nb2lnaHBoaUtLZ21oaHlIcGdsb3dyZ2t4dm9vZ3Nna2dzTnlHd2lHb2x4aHpLaGdq\na2l4a2dIaWh0TGlLaWtwaGdsZ1BqcW94amdreGlpamtyb25rb3dLdHh4cWxHaXZNdkh6eHV3S0pw\ndHhKR1JybnFPanhJUU1qaXRQanN4eG12b2prc1F3SXRxZ293d2hzTGhndHBzTEdrSW1nZ0tvaWhR\nZ08iIHRhcmdldD0iX2JsYW5rIj48aW1nIHNyYz0iaHR0cHM6Ly93d3cuZ2lvcm5vZGlnbG9yaWEu\nY29tL19zdGF0aWMvX3dlYnVwbG9hZC8yMDIxMjEyOTU1Nl83NTB4NDAwX2thY2hlbHBvcC0xMDAw\nLXY0LmpwZyI+PC9hPg==\n", "trigger": "desktop_mouse_backwardsbutton", "type": "layer", "trc": "HmzWkGjykosgghhLygHkKiloowkikQkgQroxihjkopswklNoNhhzKrLowhgGirjgIkKgPlRvvNIQPInNxNvIJrNNuIRiLJwhiLrhSikiohqvOMgigwgqooImghwosHqohqkiKhkrMigjghgjlgPgNkwiGolXiKwLOpgrmHgkoogIswwmGIsMirjggskhgRgr", "pk": "1230", "coreg_position_by_priority": 1, "height": "400" }] };
   if (debugMode) {
      console.log('### engage_layers by Init: ');
      console.log(engage_layers);
   }
   var engage_fired = false;
   var resetCSS = '<style>body{margin:0;padding:0;}</style>';
   initEngageLayer();

   function initEngageLayer() {
      for (var engage_trigger in engage_layers) {
         // Todo: bind event listener to open iframe layer
         switch (engage_trigger) {
            case 'mobile_backwardsbutton':
            case 'desktop_backwardsbutton':
               eventBackwardsButton(engage_trigger);
               break;
            case 'mobile_newtab_backwardsbutton':
               eventBackwardsButton(engage_trigger);
               eventNewTab(engage_trigger);
               break;
            case 'mobile_newtab':
               eventNewTab(engage_trigger);
               break;
            case 'desktop_mouse':
               evnetMouseLeave(engage_trigger);
               break;
            case 'desktop_mouse_backwardsbutton':
               evnetMouseLeave(engage_trigger);
               eventBackwardsButton(engage_trigger);
               break;
         }
      }
   }

   function eventBackwardsButton(engage_trigger) {
      /* check if the function should be fired for mobile or Desktop
      * example pop.trigger = desktop_backwardsbutton and device_user_agent = 'desktop'
      * desktop_backwardsbutton should not fired by device_user_agent = 'mobile'
      * */
      if (engage_trigger.indexOf(device_user_agent) > -1) {
         // activate the history entry
         history.pushState({}, document.title, location.href);
         // onpopstate does not work immediately by chrome => simulate back,forward to activate it
         if (navigator.userAgent.indexOf('Chrome') > -1 && navigator.userAgent.indexOf('Edge/') === -1) {
            history.back();
            history.forward();
            var counter = 0;
            window.onpopstate = function () {
               if (engage_fired) {
                  return;
               }
               engage_trigger = triggerCheck(engage_trigger);
               if (counter > 2) {
                  var pop = showEngageLayer(engage_trigger);
                  if (pop) {
                     openIframeLayer(pop);
                     history.pushState({}, document.title, location.href);
                  }
               }
               counter++;
               if (engage_layers[engage_trigger] && engage_layers[engage_trigger].length) {
                  history.go(1);
               }
               else if (!engage_fired) {
                  history.back();
               }
            }
         } else {
            window.addEventListener('popstate', function () {
               if (engage_fired) {
                  return;
               }
               engage_trigger = triggerCheck(engage_trigger);
               var pop = showEngageLayer(engage_trigger);
               if (pop) {
                  openIframeLayer(pop);
                  history.pushState({}, document.title, location.href);
               } else {
                  history.go(-1);
               }
            });
         }
      }
   }

   function triggerCheck(engage_trigger) {
      if (engage_trigger == 'desktop_mouse_backwardsbutton' && engage_layers[engage_trigger] && !engage_layers[engage_trigger].length) {
         engage_trigger = 'desktop_backwardsbutton';
      }
      if (engage_trigger == 'desktop_backwardsbutton' && engage_layers[engage_trigger] && !engage_layers[engage_trigger].length) {
         engage_trigger = 'desktop_mouse_backwardsbutton';
      }
      return engage_trigger;
   }

   function evnetMouseLeave(engage_trigger) {
      document.addEventListener('mouseout', function (ev) {
         if (!engage_layers[engage_trigger].length || engage_fired) {
            return;
         }
         if (ev.clientY <= 1) {
            var pop = showEngageLayer(engage_trigger);
            if (pop) {
               openIframeLayer(pop);
            }
         }
      });
   }

   function eventNewTab(engage_trigger) {
      var eventName = 'visibilitychange';
      if (document.webkitHidden != undefined) {
         eventName = 'webkitvisibilitychange';
      } else if (document.mozHidden != undefined) {
         eventName = 'mozvisibilitychange';
      } else if (document.msHidden != undefined) {
         eventName = 'msvisibilitychange';
      } else if (document.hidden != undefined) {
         eventName = 'visibilitychange';
      }

      if (engage_trigger.indexOf(device_user_agent) > -1) {
         document.addEventListener(eventName, function () {
            if (!engage_layers[engage_trigger].length || engage_fired) {
               return;
            }
            if (document.visibilityState !== 'visible') {
               var pop = showEngageLayer(engage_trigger);
               if (pop) {
                  openIframeLayer(pop);
               }
            }
         });
      }
   }

   /**
    * remove the first pop object from the array of engage_trigger
    * @param {string} engage_trigger
    * @returns {object} pop, object|null 
    */
   function showEngageLayer(engage_trigger) {
      // debugMode setting: 
      if (window.debugMode && typeof (sessionStorage) !== 'undefine') {
         sessionStorage.setItem('debugMode', true);
         debugMode = true;
      }
      if (debugMode) {
         console.log('### engage_layers Before Fire: ');
         console.log(engage_layers);
      }
      if ((engage_layers[engage_trigger] && !engage_layers[engage_trigger].length) || engage_fired) {
         return;
      }

      if (document.getElementById('pop_iframe')) {
         var pop_iframe_display = document.getElementById('pop_iframe').style.display;
         if (pop_iframe_display === 'block' && context === 'it') {
            return;
         }
      }

      var layer = engage_layers[engage_trigger] ? engage_layers[engage_trigger].shift() : null;
      if (debugMode) {
         console.log('### Trigger of current engage: ' + engage_trigger);
         console.log('### Engage layer should be fired: ');
         console.log(layer);
         console.log('### engage_layers After Fire: ');
         console.log(engage_layers);
      }
      return layer;
   }

   function openIframeLayer(pop) {
      engage_fired = true;

      // fix iphone scroll issue
      var body = document.getElementsByTagName('body')[0];
      body.style.cssText = 'overflow-y:hidden;';

      // iframe overlay
      var iframeOverlay = document.createElement('div');
      iframeOverlay.setAttribute('id', 'engage_overlay');
      iframeOverlay.setAttribute('class', 'engage_' + pop.pk);

      // iframe container
      var iframeContainer = document.createElement('div');
      iframeContainer.setAttribute('id', 'engage_layer');
      iframeContainer.style.width = pop.width != 0 ? pop.width + 'px' : '100%';
      iframeContainer.style.height = pop.height != 0 ? pop.height + 'px' : '100%';
      iframeContainer.style.top = pop.height != 0 ? 'calc(50% - ' + pop.height / 2 + 'px)' : '0';

      // close button
      var closeButton = document.createElement('div');
      closeButton.setAttribute('id', 'engage_closer');

      // iframe
      var iframe = document.createElement('iframe');
      iframe.setAttribute('class', 'engage_iframe');
      // add reset css for iframe
      try {
         iframe.src = 'data:text/html;base64,' + btoa(resetCSS + atob(pop.src));
      } catch (e) {
         iframe.src = 'data:text/html;base64,' + pop.src;
      }
      iframe.scrolling = 'no';

      iframe.onload = function () {
         // fire tracking pixel
         if (pop.trc) {
            var Http = new XMLHttpRequest();
            Http.open("GET", '/sc/' + pop.trc);
            // Http.send();
         }
      }
      // append elements
      iframeContainer.appendChild(iframe);
      iframeContainer.appendChild(closeButton);
      iframeOverlay.appendChild(iframeContainer);
      document.body.appendChild(iframeOverlay);

      // add close events
      closeButton.addEventListener('click', function (ev) {
         iframeOverlay.remove();
         document.getElementsByTagName('body')[0].style.removeProperty('overflow-y');
         engage_fired = false;
      });
   }
});


//   -------------------------

/* #159598 */
var dccBts = (function () {
   try {
      document.addEventListener('DOMContentLoaded', function () {

         var linkElements = document.getElementsByTagName('a');
         for (var i = 0; i < linkElements.length; i++) {
            linkElements[i].setAttribute('data-dcc', 0);
         }

         function watchBotClicks(event) {
            if (!event) {
               return false;
            }
            var clicked_Element = event.target;
            var clicked_Element_tag_name = event.target.nodeName.toLowerCase();

            if (clicked_Element.getAttribute('data-dcc') !== null || clicked_Element.parentElement.getAttribute('data-dcc') !== null) {
               if (clicked_Element_tag_name === "a" && clicked_Element.children.length > 0 && clicked_Element.getAttribute('data-dcc') !== null) {
                  for (var j = 0; j < clicked_Element.children.length; j++) {
                     clicked_Element.children[j].setAttribute('data-dcc', parseInt(clicked_Element.children[j].getAttribute('data-dcc')) + 1);
                  }
               } else if (clicked_Element_tag_name !== "a" && clicked_Element.parentElement.tagName.toLowerCase() === "a") {
                  clicked_Element.parentElement.setAttribute('data-dcc', parseInt(clicked_Element.parentElement.getAttribute('data-dcc')) + 1);
               }

               if (clicked_Element_tag_name === "a") {
                  if (parseInt(clicked_Element.getAttribute('data-dcc')) >= 3) {
                     handleAttr(clicked_Element);
                  }
               } else {
                  if (parseInt(clicked_Element.parentElement.getAttribute('data-dcc')) >= 3) {
                     handleAttr(clicked_Element.parentElement);
                  }
               }
               return false;
            }
         }

         function handleAttr(element) {
            element.removeProperties('target', 'class').setAttribute('href', '#');
            /**
             * remove event doesn't work somehow
             */
            // element.removeEventListener('click', watchBotClicks);
            // element.children[0].removeEventListener('click', watchBotClicks);
         };

         var watchedLinkElements = document.querySelectorAll('[data-dcc]');
         for (var l = 0; l < watchedLinkElements.length; l++) {
            watchedLinkElements[l].addEventListener('click', watchBotClicks);
         }
      });
   }
   catch (error) { }
})();


// --------------

document.addEventListener('DOMContentLoaded', function () {
   if (document.getElementsByClassName('advertiselink').length > 0) {
      document.getElementsByClassName('advertiselink')[0].addEventListener('click', function (event) {
         event.preventDefault();
         document.getElementById('advertise_layer').classList.remove('hidden');
         window.scrollTo(document.getElementById('advertise_layer').offsetLeft, document.getElementById('advertise_layer').offsetTop);
         return false;
      });
   }

   if (document.getElementById('advertise_layer') && document.getElementById('advertise_layer').querySelectorAll('.close a').length > 0) {
      document.getElementById('advertise_layer').querySelectorAll('.close a')[0].addEventListener('click', function (event) {
         event.preventDefault();
         document.getElementById('advertise_layer').classList.add('hidden');
         return false;
      });
   }
});

// ----------------------
var iframeLoaded = function () {
   document.getElementsByClassName("_sponsor_loader")[0].style.display = "none"
};
document.addEventListener("DOMContentLoaded", function () {
   Sponsorlist_sweepstake()
});
var Sponsorlist_sweepstake = function (e) {
   var s, o = {
      hidden_class: "hidden",
      sponsor_list_link_class: "sponsorlist",
      sponsor_class: "_sponsor",
      sponsor_list_class: "_sponsor_list",
      sponsor_button_class: "_sponsor_button",
      sponsor_close_button: "_sponsor_iframe_closer",
      unsubscribe: 0,
      sponsor_hiddenfield: "sponsor_ignore_user",
      sponsor_iframe_id: "sponsorlist_iframe",
      sponsor_iframe_container_id: "_sponsorlist_container",
      sponsor_iframe_background_id: "_sponsorlist_cover",
      sponsor_iframe_loader_class: "_sponsor_loader",
      use_Storage: !0, CookieListenerStatus: !1
   },
      n = {}, t = function () { for (var e = document.querySelectorAll("." + n.sponsor_button_class), s = 0; s < e.length; s++)e[s].addEventListener("click", function () { this.target === n.sponsor_iframe_id && (document.getElementsByClassName(n.sponsor_iframe_loader_class)[0].style.display = "block", a(!0)); var e = this.href; new RegExp("unsubscribe=1").test(e) && !0 !== n.use_Storage && d() }) }, r = function () { return l("sessionStorage") ? n.use_Storage = !0 : n.use_Storage = !1, !0 }, i = function () { n.use_Storage && window.addEventListener("storage", function (e) { var s, o; e.storageArea === sessionStorage && (s = sessionStorage.getItem(n.sponsor_hiddenfield), (o = document.querySelectorAll('input[name = "' + n.sponsor_hiddenfield + '"]')) && o[0] && (o[0].value = s), ab.setHF(n.sponsor_hiddenfield, s)) }), document.getElementsByClassName(n.sponsor_close_button).length && document.getElementsByClassName(n.sponsor_close_button)[0].addEventListener("click", function () { a(!1) }) }, a = function (e) { var s, o; e ? (document.getElementById(n.sponsor_iframe_container_id).classList.remove(n.hidden_class), document.getElementById(n.sponsor_iframe_background_id).classList.remove(n.hidden_class), s = document.getElementById(n.sponsor_iframe_container_id).getBoundingClientRect().height, o = document.getElementsByClassName(n.sponsor_close_button)[0].getBoundingClientRect().height, document.getElementById(n.sponsor_iframe_id).setAttribute("height", Math.ceil(s - o - 5) + "px")) : (document.getElementById(n.sponsor_iframe_container_id).classList.add(n.hidden_class), document.getElementById(n.sponsor_iframe_background_id).classList.add(n.hidden_class), document.getElementById(n.sponsor_iframe_id).src = "about:blank") }, d = function () { !1 === n.CookieListenerStatus && (n.CookieListenerStatus = !0, setInterval(function () { _() }, 1e3)) }, _ = function () { var e; (e = n.use_Storage ? sessionStorage.getItem(n.sponsor_hiddenfield) : function (e) { for (var s = e + "=", o = decodeURIComponent(document.cookie).split(";"), n = 0; n < o.length; n++) { for (var t = o[n]; " " == t.charAt(0);)t = t.substring(1); if (0 == t.indexOf(s)) return t.substring(s.length, t.length) } return null }(n.sponsor_hiddenfield)) && (document.querySelectorAll('input[name = "' + n.sponsor_hiddenfield + '"]')[0].value = e, ab.setHF(n.sponsor_hiddenfield, e)) }, l = function (e) { try { var s = window[e], o = "__storage_test__"; return s.setItem(o, o), s.removeItem(o), !0 } catch (e) { return !1 } }; n = "object" != typeof (s = e) ? o : function () { for (var e = {}, s = 0; s < arguments.length; s++)for (var o in arguments[s]) arguments[s].hasOwnProperty(o) && (e[o] = arguments[s][o]); return e }(o, s), t(), r() && (_(), i())
};






/**
 *  
 *  This library is aimed at abstracting differences between different
 *  Device APIs implementations. Particularly Mozilla B2G, WAC 2.0 and PhoneGap
 *  
 *  Author: José M. Cantera (jmcf@tid.es)
 *  
 *  Company: Telefónica Digital 
 * 
 * 
 */

/** Normalization to W3C DAP vibrator API */
if (!navigator.vibrate) {
	navigator.vibrate = function(time) {
		if (window.deviceapis) {
			deviceapis.deviceinteraction.startVibrate(function() {
			}, function() {
			}, time);
		} else if (navigator.mozVibrate) {
			navigator.mozVibrate(time);
		} else if (navigator.notification) {
			navigator.notification.vibrate(time);
		}
	}; // navigator.vibrate
} // if(navigator.vibrate)


/** Normalization to W3C Sensor API */
/* See http://dev.w3.org/2009/dap/system-info/Sensors.html */
if(!navigator.sensors) {
	navigator.sensors = {};
}

if (!navigator.sensors.accelerometer) {
	navigator.sensors.accelerometer = new function() {
		var watchId = null;
		var that = this;
		var accel = null;
		var gravity = 9.81;

		function deviceMotionHandler(e) {
			window.console.log("device motion invoked");
			// Here we normalize to the corresponding values
			var values = e.accelerationIncludingGravity;
			var obj = values;
			
			if(/*window.OrientationEvent*/true) {
				obj = {};
				// This is mozilla old staff
				window.console.log("Mozilla motion events");
				obj.x = values.x * gravity;
				obj.y = values.y * gravity;
				obj.z = values.z * gravity;
			}
			
			window.console.log(that.onsensordata);
			
			that.onsensordata({data:obj});
		}
		
		function accelHandler(acc) {
			var obj = null;
			if(acc.xAxis) {
				obj = {x: acc.xAxis, y:acc.yAxis, z:acc.zAxis};
			}
			else { 
					obj = {x: acc.x, y:acc.y, z:acc.y }; 
			}
			
			var ret = {data:obj};
			
			if(acc.timestamp) {
				ret.timestamp = acc.timestamp;
			}
			that.onsensordata(ret);
		}

		this.startWatch = function(options) {
			if (navigator.accelerometer) {
				accel = navigator.accelerometer;
			} else if (window.deviceapis) {
				if(window.deviceapis.accelerometer) {
					accel = window.deviceapis.accelerometer;
				}
			} 

			if (accel) {
				watchId = accel.watchAcceleration(accelHandler,
						this.onerror, {
							frequency : options.interval,
							minNotificationInterval: options.interval
						});
			} else if (window.DeviceMotionEvent) {
				window.addEventListener('devicemotion', deviceMotionHandler,
						false);
			} else {
				if(this.onerror) {
					this.onerror("No accelerometer found");
				}
			}
		};

		this.endWatch = function() {
			if (accel && watchId) {
				accel.clearWatch(watchId);
			} else if (window.DeviceMotionEvent) {
				window.removeEventListener('devicemotion', deviceMotionHandler);
			}
		};
	};  // navigator.sensors.accelerometer
} // if(navigator.sensors.accelerometer)


if(!navigator.sensors.orientation) {
	navigator.sensors.orientation = new function() {
		var watchId = null;
		var orient = null;
		var that = this;
	
		function deviceOrientationHandler(e) {
			window.console.log("device orientation invoked");
			// Here we normalize to the corresponding values
			var obj = {};
			
			if(e.alpha) {
				obj.alpha = e.alpha; obj.beta = e.beta; obj.gamma = e.gamma;
			}
			else if(e.x) {
				obj.gamma = -(e.x * (180 / Math.PI));  
			    obj.beta = -(e.y * (180 / Math.PI));  
			}
			
			that.onsensordata({data:obj});
		}
		
		function orientHandler(orev) {
			that.onsensordata({data:orev});
		}
		
		function compassHandler(heading) {
			var obj = {};
			obj.alpha = heading.magneticHeading;
			
			obj.beta = null;
			obj.gamma = null;
			
			that.onsensordata({data:orev,timestamp:heading.timestamp});
		}
		
		
		this.read = function() {
			if(navigator.compass) {
				navigator.compass.getCurrentHeading(compassHandler,this.onerror);
			}
			else if (window.deviceapis) {
				if(window.deviceapis.orientation) {
					var sorient = window.deviceapis.orientation;
					sorient.getCurrentOrientation(orientHandler,this.onerror);
				} 
			}
			else if(window.DeviceOrientationEvent) {
					window.addEventListener('deviceorientation', deviceOrientationHandler,
						false);
					window.setTimeout(
							function() {
								window.removeEventListener('deviceorientation', deviceOrientationHandler);
							}
					,0);
			}
			else { 
					if(this.onerror) {
						this.onerror("Orientation not available"); 
					}
			}
		};
	
		this.startWatch = function(options) {
			if (navigator.compass) {
				orient = navigator.compass;
				watchId = navigator.compass.watchHeading(compassHandler,
										this.onerror,{frequency: options.interval});
			} else if (window.deviceapis) {
				if(window.deviceapis.orientation) {
					orient = window.deviceapis.orientation;
					watchId = orient.watchOrientation(orientHandler,
									this.onerror,{minNotificationInterval: options.interval});
				}
			} 
			else if (window.DeviceOrientationEvent) {
				window.console.log("Device Orientation Event is present");
				
				window.addEventListener('deviceorientation', 
						deviceOrientationHandler, false);
				window.addEventListener('mozOrientation',
							deviceOrientationHandler,false);
			} else {
				if(this.onerror) {
					this.onerror("Orientation not available");
				}
			}
		};
	
		this.endWatch = function() {
			if (orient && watchId) {
				orient.clearWatch(watchId);
				watchId = null;
			} else if (window.DeviceOrientationEvent) {
				window.removeEventListener('deviceorientation', deviceOrientationHandler);
				window.removeEventListener('mozOrientation',deviceOrientationHandler);
			}
		};
	};	// navigator.sensors.orientation
} // if navigator.sensors.orientation
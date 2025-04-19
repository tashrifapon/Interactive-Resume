from flask import Flask, render_template, request, jsonify, redirect, url_for, send_from_directory
import json
import requests
import os
from dotenv import load_dotenv
from filelock import FileLock

app = Flask(__name__)

resume_visits_file = "static/resume.json" 

load_dotenv()
passkey_resume = os.getenv("PASSKEY_RESUME") # we respect privacy over here

#  HELPER FUNCTIONS
def read_json(file_name):
    lock = FileLock(file_name + ".lock")
    with lock:
        with open(file_name, "r") as file:
            return json.load(file)
     
def write_json(file_name, data):
    lock = FileLock(file_name + ".lock")
    with lock:
        with open(file_name, "w") as file:
            json.dump(data, file, indent=2)

def get_ip_info(ip):
    try:
        response = requests.get(f"http://ip-api.com/json/{ip}") # 3rd party api
        data = response.json()
        return {
            "result" : 1,
            "ip": ip,
            "country": data.get("country"),
            "region": data.get("regionName"),
            "city": data.get("city"),
            "latitude": data.get("lat"),
            "longitude": data.get("lon"),
            "isp": data.get("isp"),
        }
    except Exception as e:
        return {
            "result" : 0,
            "error" : str(e)
        }

# ROUTES
@app.route('/static/resume.json', methods = ['GET'])
def show_visits_resume():
    passkey = request.args.get('passkey')
    if not passkey or passkey != passkey_resume:
        return redirect(url_for("show_resume"))
    
    return send_from_directory(
        directory='static'
        ,path='resume.json' # use comma like this so it's easier for commenting out
        #,mimetype='application/json'
    )

@app.route('/TashrifAponResume', methods=['GET']) # change route name according LOL
def show_resume(): # backend services first
    data = read_json(resume_visits_file)
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)

    if get_ip_info(ip)["result"] == 1:
        addy = str(get_ip_info(ip)["city"]) + ", " + str(get_ip_info(ip)["region"])
        if addy in data["geolocation"]:
            data["geolocation"][addy] += 1
        else:
            data["geolocation"][addy] = 1
    else:
        print( get_ip_info(ip)["error"] ) # choose a better way to log and tell
        # better idea: a console.log TOO
    
    data["total_visits"] += 1
    data["html"] += 1
    if ip not in data["ip"]:
        data["ip"].append(ip)

    write_json(resume_visits_file, data)

    return render_template('resume.html')

# API (INTERNAL)
@app.route('/update-resume-version-clicks', methods = ['POST']) # version meaning format type
def update_resume_visits_and_version():
    data = read_json(resume_visits_file)
    toggle_type = request.json.get("type")
    
    if toggle_type == "html":
        data["html"] += 1
    else:
        data["pdf"] += 1
    
    write_json(resume_visits_file, data)

    return jsonify({"message":"Uploaded successfully", "total_visits":data["total_visits"]})

@app.route('/update-resume-filter-clicks', methods=['POST'])
def update_resume_filter_clicks():
    data = read_json(resume_visits_file)
    filter_type = request.json.get("filter")

    if filter_type in data["filters"]:
        data["filters"][filter_type] += 1
        data["filters"]["total"] += 1
    else:
        return jsonify({"message" : "Error: not valid filter_type"})

    write_json(resume_visits_file, data)
    return jsonify({"message":f"Filter {filter_type} updated successfully"})

@app.route('/links_clicked_metrics', methods=['POST'])
def links_clicked_metrics():
    data = read_json(resume_visits_file)
    link_type = request.json.get("link_name")

    data[link_type] += 1
    write_json(resume_visits_file, data)

    return jsonify({"message": f"Updated {link_type} count to {data[link_type]}"})

@app.route('/get_view_metrics_resume', methods=['POST'])
def get_view_metrics_resume():
    data = read_json(resume_visits_file)
    return jsonify(data)

# AND TO FINISH
if __name__ == '__main__':
    app.run(debug=True)

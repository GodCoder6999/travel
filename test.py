import urllib.request, json
req = urllib.request.Request("http://localhost:8000/api/plan", data=json.dumps({"origin":"CCU","destination":"Paris","depart":"2026-06-02","ret":"2026-06-05","pax":2,"nationality":"IN"}).encode("utf-8"), headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as res:
        print(res.status, res.read().decode())
except Exception as e:
    import urllib.error
    if isinstance(e, urllib.error.HTTPError):
        print(e.code, e.read().decode())
    else:
        print(e)

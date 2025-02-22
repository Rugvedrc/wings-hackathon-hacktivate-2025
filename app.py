from flask import Flask, request, render_template, jsonify, session, send_from_directory, redirect, url_for
from werkzeug.utils import secure_filename
from pypdf import PdfReader
import os
import json
from datetime import datetime
import logging
from logging.handlers import RotatingFileHandler
from resumeparser import ats_extractor, job_match_analysis, generate_career_path, generate_resume_suggestions

# Initialize Flask app
app = Flask(__name__, static_folder='static')
app.secret_key = os.urandom(24)

# Configuration
UPLOAD_PATH = os.path.join(os.getcwd(), '_DATA_')
os.makedirs(UPLOAD_PATH, exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
handler = RotatingFileHandler('app.log', maxBytes=10000, backupCount=3)
handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
app.logger.addHandler(handler)

@app.route('/')
def landing():
    """Serve the landing page"""
    return render_template('landing.html')

@app.route('/start')
def start():
    """Serve the main upload page"""
    return render_template('index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory(app.static_folder, filename)

@app.route("/process", methods=["POST"])
def process_resume():
    """Handle resume upload and processing"""
    try:
        if 'pdf_doc' not in request.files:
            return render_template('index.html', error="No file uploaded")
        
        file = request.files['pdf_doc']
        if file.filename == '':
            return render_template('index.html', error="No file selected")
        
        # Generate secure filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = secure_filename(f"resume_{timestamp}_{file.filename}")
        file_path = os.path.join(UPLOAD_PATH, filename)
        
        # Save the file
        file.save(file_path)
        app.logger.info(f'File saved: {file_path}')
        
        # Extract text from PDF
        resume_text = extract_text_from_file(file_path)
        if not resume_text:
            return render_template('index.html', error="Could not extract text from the file")
        
        # Parse resume
        response_text = ats_extractor(resume_text)
        parsed_data = json.loads(response_text)
        
        # Store in session for other features
        session['resume_data'] = response_text
        session['resume_file'] = file_path
        
        # Generate suggestions
        suggestions_json = generate_resume_suggestions(response_text)
        suggestions = json.loads(suggestions_json)
        
        return render_template('index.html',
                          data=parsed_data,
                          suggestions=suggestions,
                          show_job_match_form=True)
                          
    except Exception as e:
        app.logger.error(f'Error processing upload: {str(e)}')
        return render_template('index.html', error="An error occurred processing your resume")

@app.route("/job_match", methods=["GET", "POST"])  # Added GET method
def job_matching():
    """Handle job matching analysis"""
    if request.method == "GET":
        # If accessed via GET, redirect to the start page
        return redirect(url_for('start'))
        
    if 'resume_data' not in session:
        return render_template('index.html', error="Please upload your resume first")
    
    job_title = request.form.get('job_title', '')
    job_description = request.form.get('job_description', '')
    
    if not job_title or not job_description:
        return render_template('index.html', 
                              error="Job title and description are required",
                              show_job_match_form=True)
    
    try:
        # Get resume data from session
        resume_data = session.get('resume_data')
        
        # Analyze job match
        match_analysis_json = job_match_analysis(resume_data, job_title, job_description)
        match_analysis = json.loads(match_analysis_json)
        parsed_resume = json.loads(resume_data)
        
        return render_template('index.html', 
                              data=parsed_resume,
                              job_match=match_analysis,
                              job_title=job_title,
                              show_career_path_form=True)
                              
    except Exception as e:
        app.logger.error(f'Error in job matching: {str(e)}')
        return render_template('index.html', 
                              error=f"Failed to analyze job match: {str(e)}", 
                              show_job_match_form=True)

@app.route("/career_path", methods=["POST"])
def career_planning():
    if 'resume_data' not in session:
        return render_template('index.html', error="Please upload your resume first")
    
    target_role = request.form.get('target_role', '')
    
    # Get resume data from session
    resume_data = session.get('resume_data')
    
    # Generate career path
    career_path_json = generate_career_path(resume_data, target_role)
    
    try:
        career_path = json.loads(career_path_json)
        parsed_resume = json.loads(resume_data)
        
        return render_template('index.html', 
                              data=parsed_resume,
                              career_path=career_path,
                              target_role=target_role)
    except json.JSONDecodeError:
        return render_template('index.html', 
                              error="Failed to generate career path", 
                              raw_response=career_path_json)

def extract_text_from_file(file_path):
    """Extract text from uploaded file"""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        app.logger.error(f'Error extracting text from PDF: {str(e)}')
        return None

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port)

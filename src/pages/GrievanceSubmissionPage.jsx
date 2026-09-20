import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Upload, 
  Trash2, 
  MapPin, 
  UserCheck, 
  Calendar,
  AlertTriangle 
} from 'lucide-react';

export default function GrievanceSubmissionPage({ navigate }) {
  const { user, addToast } = useAuth();
  
  // Multi-step control
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  
  // Step 1: Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Step 2: Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Step 3: Evidence/Files
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [evidenceFiles, setEvidenceFiles] = useState([]); // File objects for submission

  // Step 4: Contact details
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isPrivate, setIsPrivate] = useState(false);

  // Step 6: Submission Result
  const [submitting, setSubmitting] = useState(false);
  const [resultGrievance, setResultGrievance] = useState(null);

  // Load categories and subcategories mapping
  useEffect(() => {
    async function loadCategories() {
      try {
        const catData = await api.categories.list();
        setCategories(catData);
      } catch (err) {
        addToast('Failed to load categories.', 'error');
      }
    }
    loadCategories();
  }, []);

  // Update subcategories list when category changes
  useEffect(() => {
    if (selectedCategory) {
      const match = categories.find(c => c.id === parseInt(selectedCategory));
      setSubcategories(match ? match.subcategories : []);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory, categories]);

  // AI Classification Trigger
  const handleAICheck = async () => {
    if (!description || description.trim().length < 15) {
      return addToast('Please enter a longer description first for the AI to analyze.', 'warning');
    }

    setAiLoading(true);
    setAiSuggestion(null);

    try {
      const suggestion = await api.ai.classify(description);
      
      // Fuzzy matching to tolerate LLM naming variations (e.g. 'Roads' vs 'Roads & Streets')
      const targetCat = (suggestion.category || '').toLowerCase().trim();
      const matchedCat = categories.find(c => {
        const cName = c.name.toLowerCase().trim();
        return cName === targetCat || cName.includes(targetCat) || targetCat.includes(cName);
      });
      
      setAiSuggestion({
        ...suggestion,
        catId: matchedCat ? matchedCat.id : (categories[0]?.id || null)
      });

      addToast('AI suggestions generated! Inspect the panel below.', 'info');
    } catch (err) {
      addToast('AI Classifier is currently offline.', 'warning');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    
    if (aiSuggestion.catId) {
      const catIdStr = aiSuggestion.catId.toString();
      setSelectedCategory(catIdStr);

      // Instantly populate the subcategories list in the state, preventing React batching race condition
      const matchedCategory = categories.find(c => c.id === aiSuggestion.catId);
      const subList = matchedCategory ? matchedCategory.subcategories : [];
      setSubcategories(subList);

      const targetSub = (aiSuggestion.subcategory || '').toLowerCase().trim();
      const matchedSub = subList.find(s => {
        const sName = s.name.toLowerCase().trim();
        return sName === targetSub || sName.includes(targetSub) || targetSub.includes(sName);
      }) || subList[0];

      if (matchedSub) {
        setSelectedSubcategory(matchedSub.id.toString());
      }
    }

    if (aiSuggestion.priority) {
      setPriority(aiSuggestion.priority);
    }

    setAiSuggestion(null);
    addToast('AI suggestion applied successfully!', 'success');
  };

  // Location Mock fetch
  const handleGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          // Mocking physical address fields for Windows environments
          setCity('New Delhi');
          setDistrict('Central');
          setState('Delhi');
          setPincode('110001');
          setAddress('Central Secretariat Area');
          addToast('Location coordinate metadata loaded.', 'success');
        },
        () => {
          // Fallback mock coordinate
          setLatitude(28.6139);
          setLongitude(77.2090);
          setCity('New Delhi');
          setDistrict('Central');
          setState('Delhi');
          setPincode('110001');
          setAddress('Near Central Bus Stand, Block 4');
          addToast('Mock location coordinates loaded (Geolocation denied).', 'info');
        }
      );
    }
  };

  // File Upload Drop Zone Handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limits validation: max 5 files
    if (uploadedFiles.length + files.length > 5) {
      return addToast('You can upload a maximum of 5 evidence attachments.', 'error');
    }

    // Size limit check (20MB)
    const validFiles = files.filter(file => {
      if (file.size > 20 * 1024 * 1024) {
        addToast(`File ${file.name} exceeds the 20MB limit and was rejected.`, 'error');
        return false;
      }
      return true;
    });

    setEvidenceFiles(prev => [...prev, ...validFiles]);

    // Create preview urls
    const filePreviews = validFiles.map(file => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setUploadedFiles(prev => [...prev, ...filePreviews]);
  };

  const removeFile = (idx) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
    setEvidenceFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Form Submit Execution
  const handleSubmitGrievance = async () => {
    setSubmitting(true);
    try {
      // 1. Submit basic payload
      const grievancePayload = {
        title,
        description,
        subcategoryId: parseInt(selectedSubcategory),
        priority,
        address,
        city,
        district,
        state,
        pincode,
        latitude,
        longitude,
        isPrivate: isPrivate ? 1 : 0
      };

      const result = await api.grievances.submit(grievancePayload);
      const newId = result.grievanceId;

      // 2. Upload attachments if available
      if (evidenceFiles.length > 0) {
        const formData = new FormData();
        evidenceFiles.forEach(file => {
          formData.append('evidence', file);
        });

        await api.grievances.uploadAttachments(newId, formData);
      }

      setResultGrievance({
        id: newId,
        title,
        expectedResolution: result.expectedResolution
      });

      addToast('Grievance filed successfully!', 'success');
      setStep(6); // Success screen
    } catch (err) {
      addToast(err.message || 'Submission failed. Please verify required fields.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation validation checks
  const nextStep = () => {
    if (step === 1 && (!title || !description || !selectedCategory || !selectedSubcategory)) {
      return addToast('Please fill out all basic details in Step 1.', 'warning');
    }
    if (step === 2 && (!city || !district || !state || !pincode)) {
      return addToast('Please fill out the location details.', 'warning');
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }} className="animate-fade">
      {/* Back Button */}
      {step < 6 && (
        <button onClick={() => navigate('#citizen/dashboard')} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
      )}

      <div className="glass-panel" style={{ padding: '40px 32px', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Step Timeline Indicator Header */}
        {step < 6 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>File a Grievance</h2>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <span key={n} style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: step === n ? 'var(--primary)' : (step > n ? 'var(--color-success)' : 'var(--bg-tertiary)'),
                  color: step >= n ? 'white' : 'var(--text-tertiary)',
                  transition: 'var(--transition)'
                }}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div className="animate-fade">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Step 1: Grievance Details</h3>
            
            <div className="input-group">
              <label htmlFor="title">Grievance Title *</label>
              <input 
                type="text" 
                id="title"
                placeholder="E.g., Large pothole causing accidents near Central Bus stop" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-control"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="description">Detailed Description *</label>
              <textarea 
                id="description"
                placeholder="Please describe the issue in detail, including how long it has been happening and its impact." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-control"
                style={{ minHeight: '120px', resize: 'vertical' }}
                required
              />
              <button 
                type="button" 
                onClick={handleAICheck}
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-end', marginTop: '8px', gap: '6px', color: 'var(--color-info)' }}
                disabled={aiLoading}
              >
                <Sparkles size={16} /> {aiLoading ? 'AI Analyzing...' : 'Suggest Category with AI'}
              </button>
            </div>

            {/* AI Suggestion Alert panel */}
            {aiSuggestion && (
              <div className="glass-panel" style={{
                background: 'rgba(2, 132, 199, 0.05)',
                border: '1.5px dashed var(--color-info)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-info)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Sparkles size={18} />
                  <span>JanSuniye AI Router Suggestion</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  We parsed your description. We suggest mapping to: <br/>
                  <strong>Category:</strong> {aiSuggestion.category} &rarr; <strong>Subcategory:</strong> {aiSuggestion.subcategory} <br/>
                  <strong>Priority:</strong> {aiSuggestion.priority} (Confidence: {Math.round(aiSuggestion.confidence * 100)}%)
                </div>
                <button 
                  type="button" 
                  onClick={applyAISuggestion} 
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
                >
                  Apply Suggestions
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label htmlFor="category">Category *</label>
                <select 
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('');
                  }}
                  className="input-control"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="subcategory">Subcategory *</label>
                <select 
                  id="subcategory"
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="input-control"
                  disabled={!selectedCategory}
                  required
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (SLA: {s.sla_days} Days)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Grievance Severity Priority</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(prio => (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => setPriority(prio)}
                    className="btn"
                    style={{
                      flex: 1,
                      backgroundColor: priority === prio ? 'var(--primary)' : 'var(--bg-tertiary)',
                      color: priority === prio ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem'
                    }}
                  >
                    {prio}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
              <button onClick={nextStep} className="btn btn-primary">
                Next: Location Details <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Location */}
        {step === 2 && (
          <div className="animate-fade">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Step 2: Location Information</h3>
            
            <div className="input-group">
              <label htmlFor="address">Street Address / Landmark *</label>
              <input 
                type="text" 
                id="address"
                placeholder="E.g., Pocket A, Near Mother Dairy stall" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-control"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label htmlFor="city">City *</label>
                <input 
                  type="text" 
                  id="city"
                  placeholder="New Delhi" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-control"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="district">District *</label>
                <input 
                  type="text" 
                  id="district"
                  placeholder="Central" 
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="input-control"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label htmlFor="state">State *</label>
                <input 
                  type="text" 
                  id="state"
                  placeholder="Delhi" 
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input-control"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="pincode">Pincode *</label>
                <input 
                  type="text" 
                  id="pincode"
                  placeholder="110001" 
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="input-control"
                  required
                />
              </div>
            </div>

            {/* GPS Fetch Panel */}
            <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} style={{ color: 'var(--color-active)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>GPS Metadata Selection</span>
                </div>
                <button 
                  type="button" 
                  onClick={handleGPSLocation} 
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Fetch Current GPS
                </button>
              </div>

              {latitude && longitude ? (
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Latitude:</strong> {latitude.toFixed(6)} | <strong>Longitude:</strong> {longitude.toFixed(6)}
                </div>
              ) : (
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  No coordinates linked. Click "Fetch Current GPS" or select on mock map.
                </div>
              )}

              {/* Mock interactive map emulator grid */}
              <div style={{
                marginTop: '16px',
                height: '100px',
                background: 'linear-gradient(45deg, #dbeafe 25%, #bfdbfe 25%, #bfdbfe 50%, #dbeafe 50%, #dbeafe 75%, #bfdbfe 75%, #bfdbfe 100%)',
                backgroundSize: '20px 20px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }} onClick={handleGPSLocation}>
                <span style={{ padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}>
                  {latitude ? '📍 Coordinates Attached' : '🗺️ Click to Simulate Interactive Map Select'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <button onClick={prevStep} className="btn btn-secondary">
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={nextStep} className="btn btn-primary">
                Next: Attach Evidence <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Attach Evidence */}
        {step === 3 && (
          <div className="animate-fade">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Step 3: Attach Evidence / Documents</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Provide photos, PDFs, or videos to substantiate the grievance. Supported files: JPEG, PNG, PDF, Word Doc, MP4. (Max 5 files, 20MB limit per file).
            </p>

            {/* Drag & Drop emulation zone */}
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '12px',
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-tertiary)',
              transition: 'var(--transition)',
              position: 'relative'
            }}>
              <input 
                type="file" 
                multiple 
                onChange={handleFileChange} 
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer'
                }}
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4"
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <Upload size={32} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Drag & Drop Files Here</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>or click to browse local files</span>
              </div>
            </div>

            {/* File Previews */}
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>Selected Attachments ({uploadedFiles.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {uploadedFiles.map((file, idx) => (
                    <div 
                      key={idx} 
                      className="glass-panel" 
                      style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {file.preview ? (
                          <img 
                            src={file.preview} 
                            alt="preview" 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
                          />
                        ) : (
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '4px',
                            background: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}>
                            {file.name.split('.').pop().toUpperCase()}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                            {file.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{file.size}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(idx)} 
                        className="btn"
                        style={{ padding: '6px', color: 'var(--color-error)', background: 'none' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <button onClick={prevStep} className="btn btn-secondary">
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={nextStep} className="btn btn-primary">
                Next: Contact Info <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Contact Details */}
        {step === 4 && (
          <div className="animate-fade">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Step 4: Contact Information</h3>
            
            <div className="input-group">
              <label htmlFor="c-email">Registered Email Address</label>
              <input 
                type="email" 
                id="c-email"
                value={email}
                className="input-control"
                disabled
              />
            </div>

            <div className="input-group">
              <label htmlFor="c-phone">Mobile Phone (For SMS/Status updates)</label>
              <input 
                type="text" 
                id="c-phone"
                placeholder="+91 XXXXX XXXXX" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-control"
              />
            </div>

            {/* Privacy Checkbox */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--color-info)', marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <input 
                  type="checkbox" 
                  id="privacy" 
                  checked={isPrivate} 
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  style={{ marginTop: '4px', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                  <label htmlFor="privacy" style={{ fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    Keep My Contact Details Anonymous
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    If enabled, your registered email and phone number will be hidden from public view. Only resolving officers and administrators will have access to it for official validation.
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <button onClick={prevStep} className="btn btn-secondary">
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={nextStep} className="btn btn-primary">
                Next: Review Submission <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Review Summary */}
        {step === 5 && (
          <div className="animate-fade">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Step 5: Review Grievance Summary</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Please inspect all details before filing your complaint.
            </p>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Basic Section */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Grievance Details</span>
                <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '4px' }}>{title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                  {description}
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.8rem' }}><strong>Priority:</strong> {priority}</span>
                  <span style={{ fontSize: '0.8rem' }}><strong>Category:</strong> {categories.find(c => c.id === parseInt(selectedCategory))?.name || 'Unknown'}</span>
                </div>
              </div>

              {/* Location Section */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Location Details</span>
                <p style={{ fontSize: '0.85rem', marginTop: '4px', lineHeight: 1.4 }}>
                  {address}, {city}, {district}, {state} - {pincode}
                </p>
                {latitude && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                    Linked Coordinates: Lat {latitude.toFixed(4)}, Lng {longitude.toFixed(4)}
                  </span>
                )}
              </div>

              {/* Evidence list */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Attachments</span>
                {uploadedFiles.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>No attachments uploaded.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {uploadedFiles.map((file, idx) => (
                      <span key={idx} style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.75rem' }}>
                        📎 {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy summary */}
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Privacy Settings</span>
                <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                  {isPrivate ? '🔒 Private - Contact details anonymous' : '🔓 Public - Contact details visible'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <button onClick={prevStep} className="btn btn-secondary">
                <ArrowLeft size={16} /> Back
              </button>
              <button 
                onClick={handleSubmitGrievance} 
                className="btn btn-primary"
                disabled={submitting}
                style={{ background: 'var(--color-success)', color: 'white' }}
              >
                {submitting ? 'Submitting ticket...' : 'Confirm & Submit Grievance'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Success Receipt Screen */}
        {step === 6 && resultGrievance && (
          <div className="animate-fade" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(22, 163, 74, 0.1)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto'
            }}>
              <CheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Grievance Filed Successfully!
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px' }}>
              Your complaint has been logged in the system. The designated department has been notified.
            </p>

            {/* Receipt Box */}
            <div className="glass-panel" style={{
              padding: '24px',
              maxWidth: '480px',
              margin: '0 auto 36px auto',
              background: 'var(--bg-tertiary)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Grievance ID:</span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-active)' }}>{resultGrievance.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Filing Title:</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {resultGrievance.title}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Submission Date:</span>
                <span style={{ fontSize: '0.85rem' }}>{new Date().toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Expected Resolution SLA:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {resultGrievance.expectedResolution}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => navigate(`#grievance/detail/${resultGrievance.id}`)}
                className="btn btn-primary"
              >
                Inspect Details
              </button>
              <button 
                onClick={() => navigate('#citizen/dashboard')}
                className="btn btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

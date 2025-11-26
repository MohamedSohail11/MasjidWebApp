import React, { useState, useEffect } from 'react';

// === Enum Mappings based on your Schema ===
const ResidentialStatus = { 'Own House': 0, 'Rent House': 1 };
const OccupationTypeEnum = { 'Working': 0, 'Business': 1, 'Unemployed': 2, 'Retired': 3 };
const IncomeRangeEnum = { 'Below 10,000': 0, '10,000 - 25,000': 1, '25,000 - 50,000': 2, '50,000 - 1,00,000': 3, 'Above 1,00,000': 4 };
const MaritalStatusEnum = { 'Single': 0, 'Married': 1, 'Present': 1, 'Divorced': 2, 'Expired': 3, 'Late': 3 };
const GenderEnum = { 'Male': 0, 'Female': 1 }; // Inferred, though backend might handle this differently.

const RegistrationForm = () => {
    // --- State Management ---
    const [formData, setFormData] = useState({
        headOfFamily: 'Husband',
        // Personal Details
        photo: null,
        fullName: '',
        phoneNumber: '',
        alternateNumber: '',
        email: '',
        dob: '',
        caste: '',
        aadharNumber: '',
        qualification: '',
        // Occupation
        occupationType: '',
        occupationDetails: '',
        companyName: '',
        monthlyIncome: '',
        // Residential
        houseType: '',
        address: '',
        // Parents
        fatherName: '',
        fatherStatus: '',
        fatherDeathYear: '',
        motherName: '',
        motherStatus: '',
        motherDeathYear: '',
        // Husband Details (if female HoF)
        husbandName: '',
        husbandDOB: '',
        husbandOccupation: '',
        husbandNativity: '',
        husbandCaste: '',
        husbandQualification: '',
        husbandBloodGroup: '',
        husbandStatus: '',
        // Wife Details (if male HoF)
        wivesCount: 1,
        wives: [{ name: '', dob: '', marriageDate: '', occupation: '', nativity: '', caste: '', qualification: '', bloodGroup: '', status: '' }],
        // Children
        children: [],
        remarks: ''
    });

    const [photoPreview, setPhotoPreview] = useState(null);

    // --- Handlers ---

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Aadhar Validation Logic (Pixel perfect regex check)
        if (name === 'aadharNumber') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, photo: file }));
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    // --- Dynamic Wife Logic ---

    const selectWivesCount = (count) => {
        let newWives = [...formData.wives];
        if (count > newWives.length) {
            // Add empty wives
            for (let i = newWives.length; i < count; i++) {
                newWives.push({ name: '', dob: '', marriageDate: '', occupation: '', nativity: '', caste: '', qualification: '', bloodGroup: '', status: '' });
            }
        } else if (count < newWives.length) {
            // Remove extra wives
            newWives = newWives.slice(0, count);
        }
        setFormData(prev => ({ ...prev, wivesCount: count, wives: newWives }));
    };

    const handleWifeChange = (index, field, value) => {
        const newWives = [...formData.wives];
        newWives[index][field] = value;
        setFormData(prev => ({ ...prev, wives: newWives }));
    };

    // --- Dynamic Child Logic ---

    const addChild = () => {
        setFormData(prev => ({
            ...prev,
            children: [...prev.children, { name: '', dob: '', mother: '', qualification: '', marriageStatus: '', bloodGroup: '', phyChallenged: '' }]
        }));
    };

    const removeChild = (index) => {
        const newChildren = formData.children.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, children: newChildren }));
    };

    const handleChildChange = (index, field, value) => {
        const newChildren = [...formData.children];
        newChildren[index][field] = value;
        setFormData(prev => ({ ...prev, children: newChildren }));
    };

    // --- Helper for Mother Options ---
    const getMotherOptions = () => {
        if (formData.headOfFamily === 'Husband') {
            return formData.wives.map((wife, idx) => (
                <option key={idx} value={`Wife ${idx + 1}`}>
                    {wife.name || `Wife ${idx + 1}`} {wife.status ? `(${wife.status})` : ''}
                </option>
            ));
        } else {
            return <option value="Self">Self / நானே</option>;
        }
    };

    // --- Form Submission & Payload Construction ---


    // --- Safe Data Converters ---
    const toApiInt = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? null : parsed;
    };

    const toApiDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date.toISOString();
    };

    // --- Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Basic Validation (Main Applicant)
        if (!formData.fullName || !formData.phoneNumber || !formData.houseType || !formData.address) {
            alert('Please fill all required fields: Full Name, Phone, House Type, Address');
            return;
        }

        // 2. Filter Wives (Don't send partial/empty rows)
        let activeWives = [];
        if (formData.headOfFamily === 'Husband') {
            const count = parseInt(formData.wivesCount);
            // Get the raw rows based on count
            const rawWives = formData.wives.slice(0, count);

            // Filter: Only include wives if a Name is typed. 
            // If Name is empty, we exclude them from the ARRAY, but keep the COUNT.
            activeWives = rawWives.filter(w => w.name && w.name.trim() !== "");

            // Validation: If you DID type a name, you must fill the rest.
            for (let i = 0; i < activeWives.length; i++) {
                const w = activeWives[i];
                if (!w.dob || !w.caste || !w.nativity || !w.occupation || !w.qualification || !w.bloodGroup || !w.status) {
                    alert(`Since you entered a name for Wife ${i + 1}, you must fill ALL her details (DOB, Caste, Native, Qualification, Blood Group, Status).`);
                    return;
                }
            }

        }

        // 3. Child Validation
        for (let i = 0; i < formData.children.length; i++) {
            if (!formData.children[i].dob) {
                alert(`Error: Date of Birth is REQUIRED for Child ${i + 1}.`);
                return;
            }
        }

        // 4. Construct Payload
        const activeBloodGroup = formData.headOfFamily === 'Wife' ? formData.husbandBloodGroup : null;

        const payload = {
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            residentialStatus: ResidentialStatus[formData.houseType] ?? 0,
            address: formData.address,
            alternateNumber: formData.alternateNumber || null,
            dateOfBirth: toApiDate(formData.dob),
            casteGroup: formData.caste || null,
            aadharNumber: formData.aadharNumber || null,
            qualification: formData.qualification || null,

            marriageDate: formData.wife.marriageDate || null,
            bloodGroup: activeBloodGroup || null,

            occupation: OccupationTypeEnum[formData.occupationType] !== undefined ? OccupationTypeEnum[formData.occupationType] : null,
            occupationDetail: formData.occupationDetails || null,
            monthlyIncome: IncomeRangeEnum[formData.monthlyIncome] !== undefined ? IncomeRangeEnum[formData.monthlyIncome] : null,

            emailId: formData.email || null,

            fatherName: formData.fatherName || null,
            fatherOccupation: null,
            fatherDeathYear: formData.fatherStatus === 'Late' ? toApiInt(formData.fatherDeathYear) : null,

            motherName: formData.motherName || null,
            motherOccupation: null,
            motherDeathYear: formData.motherStatus === 'Late' ? toApiInt(formData.motherDeathYear) : null,

            // CRITICAL FIX: Always send the SELECTED count (e.g., 1), NOT the array length (0)
            numberOfWives: formData.headOfFamily === 'Husband' ? toApiInt(formData.wivesCount) : 0,
            numberOfChildren: formData.children.length,
            feedback: formData.remarks || null,

            wifeDetails: [],
            childDetails: []
        };

        // Map Wives (Only the Valid/Filled ones)
        // If you left names empty, this array will be [] (empty), but numberOfWives will still be 1.
        // This satisfies the backend logic.
        if (formData.headOfFamily === 'Husband') {
            payload.wifeDetails = activeWives.map((wife) => ({
                name: wife.name,
                dateOfBirth: toApiDate(wife.dob),
                occupation: wife.occupation,
                native: wife.nativity,
                caste: wife.caste,
                qualification: wife.qualification,
                bloodGroup: wife.bloodGroup,
                maritalStatus: MaritalStatusEnum[wife.status] !== undefined ? MaritalStatusEnum[wife.status] : 1
            }));
        }

        // Map Children
        payload.childDetails = formData.children.map((child) => ({
            name: child.name || "Unknown",
            gender: 0,
            dateOfBirth: toApiDate(child.dob),
            qualification: child.qualification || null,
            maritalStatus: MaritalStatusEnum[child.marriageStatus] !== undefined ? MaritalStatusEnum[child.marriageStatus] : 0,
            bloodGroup: child.bloodGroup || null,
            isPhysicallyChallenged: child.phyChallenged === 'Yes'
        }));

        console.log("Submitting Payload:", JSON.stringify(payload, null, 2));

        try {
            const response = await fetch('https://masjiderpapi-production.up.railway.app/api/PersonalDetails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error("SERVER ERROR:", errorData);

                if (errorData && errorData.errors) {
                    const entries = Object.entries(errorData.errors);
                    const firstError = entries[0];
                    alert(`Validation Error: ${firstError[1][0]}`);
                } else {
                    alert(`Server responded with error ${response.status}`);
                }
                return;
            }

            const result = await response.json();
            alert("Form Submitted Successfully!");
            console.log("Success:", result);

        } catch (error) {
            console.error("Submission Failed:", error);
            alert(`Network/Code Error: ${error.message}`);
        }
    };
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    Masjid Member Registration
                </h1>
                <h2 className="text-xl md:text-2xl text-gray-600">
                    மஸ்ஜித் உறுப்பினர் பதிவு
                </h2>
            </div>

            <form id="memberForm" onSubmit={handleSubmit} noValidate>

                {/* Head of Family Section */}
                <div className="section-card">
                    <h3 className="section-title">Head of Family / குடும்பத் தலைவர்</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        If the husband has passed away, select <strong>Wife</strong> as Head of Family and fill husband details below.
                        / கணவர் மறைந்திருந்தால், <strong>குடும்பத் தலைவர்</strong> ஆக "மனைவி" என்பதைத் தேர்ந்தெடுத்து, கீழே கணவர் விவரங்களை நிரப்பவும்.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">Head of Family / குடும்பத் தலைவர்</label>
                            <select
                                name="headOfFamily"
                                className="form-select"
                                value={formData.headOfFamily}
                                onChange={handleChange}
                            >
                                <option value="">Select / தேர்ந்தெடு</option>
                                <option value="Husband">Husband / கணவர்</option>
                                <option value="Wife">Wife / மனைவி</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Applicant Details Section */}
                <div className="section-card">
                    <h3 className="section-title">Applicant Details / விண்ணப்பதாரர் விவரங்கள்</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Photo Upload */}
                        <div className="md:col-span-2">
                            <label className="form-label">Photo / புகைப்படம்</label>
                            <div className="photo-upload-box" onClick={() => document.getElementById('photoInput').click()}>
                                <input type="file" id="photoInput" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                <div id="photoPreview">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="photo-preview" />
                                    ) : (
                                        <>
                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <p className="mt-2 text-sm text-gray-600">Click to upload photo</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div className="md:col-span-2">
                            <label className="form-label">
                                Full Name / முழுப் பெயர் <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                className="form-input"
                                pattern="^[a-zA-Z\s.]+$"
                                placeholder="Enter full name"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                            <p className="error-message">Please enter a valid name (letters only)</p>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="form-label">
                                Phone Number / தொலைபேசி எண் <span className="required">*</span>
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                className="form-input"
                                pattern="^[6-9]\d{9}$"
                                placeholder="10 digit mobile number"
                                maxLength="10"
                                required
                                value={formData.phoneNumber}
                                onChange={handleChange}
                            />
                            <p className="error-message">Enter valid 10-digit mobile number</p>
                        </div>

                        {/* Alternate Number */}
                        <div>
                            <label className="form-label">
                                Alternate Number (WhatsApp) / மாற்று எண்
                            </label>
                            <input
                                type="tel"
                                name="alternateNumber"
                                className="form-input"
                                pattern="^[6-9]\d{9}$"
                                placeholder="10 digit mobile number"
                                maxLength="10"
                                value={formData.alternateNumber}
                                onChange={handleChange}
                            />
                            <p className="error-message">Enter valid 10-digit mobile number</p>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="form-label">Email ID / மின்னஞ்சல்</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                placeholder="example@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <p className="error-message">Enter valid email address</p>
                        </div>

                        {/* DOB */}
                        <div>
                            <label className="form-label">Date of Birth / பிறந்த தேதி</label>
                            <input
                                type="date"
                                name="dob"
                                className="form-input"
                                max="2025-12-31"
                                value={formData.dob}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Caste */}
                        <div>
                            <label className="form-label">Caste / சாதி</label>
                            <select name="caste" className="form-select" value={formData.caste} onChange={handleChange}>
                                <option value="">Select / தேர்ந்தெடு</option>
                                <option value="Dakni">Dakni / டக்னி</option>
                                <option value="Labbai">Labbai / லப்பை</option>
                                <option value="Others">Others / மற்றவை</option>
                            </select>
                        </div>

                        {/* Aadhar Number */}
                        <div>
                            <label className="form-label">Aadhar Number / ஆதார் எண்</label>
                            <input
                                type="text"
                                name="aadharNumber"
                                className="form-input"
                                pattern="^[2-9]\d{11}$"
                                placeholder="12 digit Aadhar number"
                                maxLength="12"
                                value={formData.aadharNumber}
                                onChange={handleChange}
                            />
                            <p className="error-message">Enter valid 12-digit Aadhar number</p>
                        </div>

                        {/* Qualification */}
                        <div>
                            <label className="form-label">Qualification / கல்வித் தகுதி</label>
                            <input
                                type="text"
                                name="qualification"
                                className="form-input"
                                placeholder="e.g., B.Tech, MBA"
                                value={formData.qualification}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Occupation Section */}
                <div className="section-card">
                    <h3 className="section-title">Occupation / தொழில்</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">Occupation Type / தொழில் வகை</label>
                            <select name="occupationType" className="form-select" value={formData.occupationType} onChange={handleChange}>
                                <option value="">Select / தேர்ந்தெடு</option>
                                <option value="Working">Working / வேலை</option>
                                <option value="Business">Business / வியாபாரம்</option>
                                <option value="Unemployed">Unemployed / வேலையில்லாதவர்</option>
                                <option value="Retired">Retired / ஓய்வு பெற்றவர்</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Occupation Details / தொழில் விவரம்</label>
                            <input type="text" name="occupationDetails" className="form-input" placeholder="e.g., Software Engineer" value={formData.occupationDetails} onChange={handleChange} />
                        </div>

                        <div className="md:col-span-2">
                            <label className="form-label">Company or Business Name / நிறுவனம் அல்லது வியாபார பெயர்</label>
                            <input type="text" name="companyName" className="form-input" placeholder="Company/Business name" value={formData.companyName} onChange={handleChange} />
                        </div>

                        <div className="md:col-span-2">
                            <label className="form-label">Monthly Family Income / மாத குடும்ப வருமானம்</label>
                            <div className="radio-group">
                                {Object.keys(IncomeRangeEnum).map((range) => (
                                    <div className="radio-item" key={range}>
                                        <input
                                            type="radio"
                                            name="monthlyIncome"
                                            value={range}
                                            checked={formData.monthlyIncome === range}
                                            onChange={handleChange}
                                        />
                                        <label>{range.replace('Below', 'Below ₹').replace('Above', 'Above ₹').replace('10,000', '₹10,000')}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Residential Section */}
                <div className="section-card">
                    <h3 className="section-title">Residential Information / குடியிருப்பு தகவல்</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="form-label">House Type / வீடு வகை</label>
                            <div className="radio-group">
                                <div className="radio-item">
                                    <input type="radio" name="houseType" value="Own House" checked={formData.houseType === 'Own House'} onChange={handleChange} />
                                    <label>Own House / சொந்த வீடு</label>
                                </div>
                                <div className="radio-item">
                                    <input type="radio" name="houseType" value="Rent House" checked={formData.houseType === 'Rent House'} onChange={handleChange} />
                                    <label>Rent House / வாடகை வீடு</label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Address / முகவரி</label>
                            <textarea name="address" rows="4" className="form-textarea" placeholder="Enter full address" value={formData.address} onChange={handleChange}></textarea>
                        </div>
                    </div>
                </div>

                {/* Parent Details Sections */}
                <div className="section-card">
                    <h3 className="section-title">Father Details / தந்தை விவரங்கள்</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">Father Name / தந்தை பெயர்</label>
                            <input type="text" name="fatherName" className="form-input" placeholder="Father's name" value={formData.fatherName} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="form-label">Father Status / தந்தை நிலை</label>
                            <select name="fatherStatus" className="form-select" value={formData.fatherStatus} onChange={handleChange}>
                                <option value="">Select / தேர்ந்தெடு</option>
                                <option value="Alive">Alive / உயிருடன்</option>
                                <option value="Late">Late / மறைந்தவர்</option>
                            </select>
                        </div>
                        {formData.fatherStatus === 'Late' && (
                            <div>
                                <label className="form-label">Father Death Year / தந்தை மறைந்த ஆண்டு</label>
                                <input type="number" name="fatherDeathYear" className="form-input" min="1900" max="2025" placeholder="YYYY" value={formData.fatherDeathYear} onChange={handleChange} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="section-card">
                    <h3 className="section-title">Mother Details / தாய் விவரங்கள்</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">Mother Name / தாய் பெயர்</label>
                            <input type="text" name="motherName" className="form-input" placeholder="Mother's name" value={formData.motherName} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="form-label">Mother Status / தாய் நிலை</label>
                            <select name="motherStatus" className="form-select" value={formData.motherStatus} onChange={handleChange}>
                                <option value="">Select / தேர்ந்தெடு</option>
                                <option value="Alive">Alive / உயிருடன்</option>
                                <option value="Late">Late / மறைந்தவர்</option>
                            </select>
                        </div>
                        {formData.motherStatus === 'Late' && (
                            <div>
                                <label className="form-label">Mother Death Year / தாய் மறைந்த ஆண்டு</label>
                                <input type="number" name="motherDeathYear" className="form-input" min="1900" max="2025" placeholder="YYYY" value={formData.motherDeathYear} onChange={handleChange} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Conditional Sections based on Head of Family */}

                {formData.headOfFamily === 'Husband' && (
                    <div className="section-card">
                        <h3 className="section-title">Wife Details / மனைவி விவரங்கள்</h3>
                        <div className="mb-6">
                            <label className="form-label">How many wives (total, including past marriages)? / எத்தனை மனைவிகள் (மொத்தம், கடந்த திருமணங்கள் உட்பட)?</label>
                            <p className="text-sm text-gray-600 mb-3">Select total number of marriages. You will specify status (Present/Divorced/Expired) for each wife.</p>
                            <div className="wife-selector-grid">
                                {[1, 2, 3, 4].map(num => (
                                    <div
                                        key={num}
                                        className={`wife-selector-btn ${formData.wivesCount === num ? 'active' : ''}`}
                                        onClick={() => selectWivesCount(num)}
                                    >
                                        <div className="text-2xl">{num}</div>
                                        <div className="text-xs mt-1">{num === 1 ? ' Wife' : ` Wives`}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {formData.wives.map((wife, index) => (
                            <div key={index} className="wife-card">
                                <div className="wife-header">
                                    {['First', 'Second', 'Third', 'Fourth'][index]} Wife Details / மனைவி {['1', '2', '3', '4'][index]} விவரங்கள்
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Wife Fields */}
                                    <div>
                                        <label className="form-label">Name / பெயர்</label>
                                        <input type="text" placeholder="Wife's name" className="form-input" value={wife.name} onChange={(e) => handleWifeChange(index, 'name', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="form-label">Date of Birth / பிறந்த தேதி</label>
                                        <input type="date" className="form-input" value={wife.dob} onChange={(e) => handleWifeChange(index, 'dob', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="form-label">Marriage Date / திருமண தேதி</label>
                                        <input type="date" className="form-input" value={wife.marriageDate} onChange={(e) => handleWifeChange(index, 'marriageDate', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="form-label">Occupation / தொழில்</label>
                                        <input type="text" placeholder="Occupation" className="form-input" value={wife.occupation} onChange={(e) => handleWifeChange(index, 'occupation', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="form-label">Nativity / பூர்வீகம்</label>
                                        <input type="text" className="form-input" placeholder="Nativity" value={wife.nativity} onChange={(e) => handleWifeChange(index, 'nativity', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="form-label">Caste / சாதி</label>
                                        <select className="form-select" value={wife.caste} onChange={(e) => handleWifeChange(index, 'caste', e.target.value)}>
                                            <option value="">Select / தேர்ந்தெடு</option>
                                            <option value="Dakni">Dakni / டக்னி</option>
                                            <option value="Labbai">Labbai / லப்பை</option>
                                            <option value="Others">Others / மற்றவை</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Qualification / கல்வித் தகுதி</label>
                                        <input type="text" placeholder="Qualification" className="form-input" value={wife.qualification} onChange={(e) => handleWifeChange(index, 'qualification', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="form-label">Blood Group / இரத்த வகை</label>
                                        <select className="form-select" value={wife.bloodGroup} onChange={(e) => handleWifeChange(index, 'bloodGroup', e.target.value)}>
                                            <option value="">Select / தேர்ந்தெடு</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="form-label">Status / நிலை <span className="required">*</span></label>
                                        <select className="form-select" required value={wife.status} onChange={(e) => handleWifeChange(index, 'status', e.target.value)}>
                                            <option value="">Select / தேர்ந்தெடு</option>
                                            <option value="Present">Present / தற்போது</option>
                                            <option value="Divorced">Divorced / விவாகரத்து </option>
                                            <option value="Expired">Expired / மறைந்தவர்</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {formData.headOfFamily === 'Wife' && (
                    <div className="section-card">
                        <h3 className="section-title">Husband Details / கணவர் விவரங்கள்</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="form-label">Husband Name / கணவர் பெயர்</label>
                                <input type="text" name="husbandName" className="form-input" value={formData.husbandName} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="form-label">Date of Birth / பிறந்த தேதி</label>
                                <input type="date" name="husbandDOB" className="form-input" value={formData.husbandDOB} onChange={handleChange} />
                            </div>
    
                            <div>
                                <label className="form-label">Occupation / தொழில்</label>
                                <input type="text" name="husbandOccupation" className="form-input" value={formData.husbandOccupation} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="form-label">Nativity / பூர்வீகம்</label>
                                <input type="text" name="husbandNativity" className="form-input" value={formData.husbandNativity} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="form-label">Status / கணவர் நிலை</label>
                                <select name="husbandStatus" className="form-select" value={formData.husbandStatus} onChange={handleChange}>
                                    <option value="">Select</option>
                                    <option value="Present">Present</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Expired">Expired</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Children Details Section */}
                <div className="section-card">
                    <h3 className="section-title">Children Details / குழந்தைகள் விவரங்கள்</h3>

                    {formData.children.map((child, index) => (
                        <div key={index} className="child-card">
                            <div className="child-header">
                                <span className="child-number">Child {index + 1} / குழந்தை {index + 1}</span>
                                <button type="button" className="btn-danger" onClick={() => removeChild(index)}>Remove</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Name / பெயர்</label>
                                    <input type="text" className="form-input" value={child.name} onChange={(e) => handleChildChange(index, 'name', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Date of Birth / பிறந்த தேதி</label>
                                    <input type="date" className="form-input" value={child.dob} onChange={(e) => handleChildChange(index, 'dob', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Mother / தாய்</label>
                                    <select className="form-select" value={child.mother} onChange={(e) => handleChildChange(index, 'mother', e.target.value)}>
                                        <option value="">Select / தேர்ந்தெடு</option>
                                        {getMotherOptions()}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Qualification / கல்வித் தகுதி</label>
                                    <input type="text" placeholder="Qualification" className="form-input" value={child.qualification} onChange={(e) => handleChildChange(index, 'qualification', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Marriage Status / திருமண நிலை</label>
                                    <select className="form-select" value={child.marriageStatus} onChange={(e) => handleChildChange(index, 'marriageStatus', e.target.value)}>
                                        <option value="">Select / தேர்ந்தெடு</option>
                                        <option value="Single">Single / திருமணமாகாதவர்</option>
                                        <option value="Married">Married / திருமணமானவர்</option>
                                        <option value="Divorced">Divorced / விவாகரத்து</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Blood Group / இரத்த வகை</label>
                                    <select className="form-select" value={child.bloodGroup} onChange={(e) => handleChildChange(index, 'bloodGroup', e.target.value)}>
                                        <option value="">Select / தேர்ந்தெடு</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">
                                        Physically Challenged / உடல் குறைபாடு Challenged</label>
                                    <div className="radio-group">
                                        <div className="radio-item">
                                            <input type="radio" name={`child${index}Phy`} checked={child.phyChallenged === 'Yes'} onChange={() => handleChildChange(index, 'phyChallenged', 'Yes')} />
                                            <label>Yes / ஆம்</label>
                                        </div>
                                        <div className="radio-item">
                                            <input type="radio" name={`child${index}Phy`} checked={child.phyChallenged === 'No'} onChange={() => handleChildChange(index, 'phyChallenged', 'No')} />
                                            <label>No / இல்லை</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button type="button" className="btn-secondary" onClick={addChild}>+ Add Child / குழந்தை சேர்க்க</button>
                </div>

                {/* Remarks */}
                <div className="section-card">
                    <h3 className="section-title">Remarks / குறிப்புகள்</h3>
                    <textarea name="remarks" rows="4" className="form-textarea" placeholder="Any additional information..." value={formData.remarks} onChange={handleChange}></textarea>
                </div>

                <div className="mt-8">
                    <button type="submit" className="btn-primary">Save / சேமிக்கவும்</button>
                </div>
            </form>
        </div>
    );
};

export default RegistrationForm;
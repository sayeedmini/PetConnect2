import { useEffect, useState } from 'react';
import { submitBreedVerification, getUserVerifications } from '../services/catalogApi';
import { getUser } from '../../auth/utils/auth';

function BreedVerification() {
    const [verifications, setVerifications] = useState([]);
    const [formData, setFormData] = useState({
        animalType: '',
        petName: '',
        breed: '',
        images: []
    });
    const [loading, setLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState('');
    const [breedOptions, setBreedOptions] = useState([]);

    const currentUser = getUser();
    const userId = currentUser?._id || currentUser?.id || 'user123';
    const userEmail = currentUser?.email || 'test@user.com';

    const breedData = {
        dog: [
            'Golden Retriever', 'Labrador', 'German Shepherd', 'Bulldog', 
            'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 
            'Boxer', 'Siberian Husky', 'Dachshund', 'Shih Tzu'
        ],
        cat: [
            'Persian', 'Maine Coon', 'Siamese', 'Bengal', 
            'Ragdoll', 'Sphynx', 'British Shorthair', 'Abyssinian',
            'Scottish Fold', 'Birman', 'Oriental', 'Burmese'
        ],
        bird: [
            'Parrot', 'Macaw', 'Cockatiel', 'African Grey',
            'Lovebird', 'Canary', 'Finch', 'Budgie',
            'Cockatoo', 'Amazon Parrot', 'Conure', 'Eclectus'
        ],
        rabbit: [
            'Holland Lop', 'Netherland Dwarf', 'Flemish Giant', 'Mini Rex',
            'Lionhead', 'Angora', 'Rex', 'Polish Rabbit'
        ],
        other: [
            'Hamster', 'Guinea Pig', 'Ferret', 'Turtle',
            'Lizard', 'Snake', 'Fish', 'Horse'
        ]
    };

    const animalTypes = [
        { value: 'dog', label: '🐕 Dog', icon: '🐕' },
        { value: 'cat', label: '🐈 Cat', icon: '🐈' },
        { value: 'bird', label: '🐦 Bird', icon: '🐦' },
        { value: 'rabbit', label: '🐇 Rabbit', icon: '🐇' },
        { value: 'other', label: '🐾 Other Pet', icon: '🐾' }
    ];

    useEffect(() => {
        loadVerifications();
    }, []);

    useEffect(() => {
        if (formData.animalType && breedData[formData.animalType]) {
            setBreedOptions(breedData[formData.animalType]);
            setFormData({ ...formData, breed: '' });
        } else {
            setBreedOptions([]);
        }
    }, [formData.animalType]);

    const loadVerifications = async () => {
        setLoading(true);
        const data = await getUserVerifications(userId);
        if (data.success) {
            setVerifications(data.verifications);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.animalType) {
            alert('Please select an animal type');
            return;
        }
        if (!formData.petName) {
            alert('Please enter your pet name');
            return;
        }
        if (!formData.breed) {
            alert('Please select or enter breed');
            return;
        }

        const result = await submitBreedVerification({
            userId,
            userEmail,
            animalType: formData.animalType,
            petName: formData.petName,
            breed: formData.breed,
            images: formData.images
        });

        if (result.success) {
            alert('✅ Verification request submitted! Our team will review within 24-48 hours.');
            setFormData({ animalType: '', petName: '', breed: '', images: [] });
            loadVerifications();
        } else {
            alert('Failed to submit');
        }
    };

    const addImage = () => {
        if (imageUrl) {
            setFormData({
                ...formData,
                images: [...formData.images, imageUrl]
            });
            setImageUrl('');
        }
    };

    const removeImage = (index) => {
        setFormData({
            ...formData,
            images: formData.images.filter((_, i) => i !== index)
        });
    };

    // Function to download certificate
    const downloadCertificate = (verification) => {
        // Create certificate content
        const certificateContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Breed Verification Certificate</title>
                <style>
                    body {
                        font-family: 'Georgia', serif;
                        margin: 0;
                        padding: 40px;
                        background: #f5f0e8;
                    }
                    .certificate {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        padding: 40px;
                        border: 10px solid #d4af37;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                    h1 {
                        color: #d4af37;
                        font-size: 36px;
                        margin-bottom: 10px;
                    }
                    .seal {
                        font-size: 60px;
                        margin: 20px 0;
                    }
                    .pet-name {
                        font-size: 32px;
                        font-weight: bold;
                        margin: 20px 0;
                        color: #2c5f2d;
                    }
                    .details {
                        font-size: 18px;
                        margin: 20px 0;
                        line-height: 1.8;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 14px;
                        color: #666;
                    }
                    .signature {
                        margin-top: 40px;
                        border-top: 1px solid #ccc;
                        padding-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <h1>🐾 PET BREED VERIFICATION CERTIFICATE 🐾</h1>
                    <div class="seal">🏆</div>
                    <p>This certificate is proudly presented to</p>
                    <div class="pet-name">${verification.petName}</div>
                    <div class="details">
                        <p><strong>Breed:</strong> ${verification.breed}</p>
                        <p><strong>Animal Type:</strong> ${verification.animalType?.toUpperCase() || 'PET'}</p>
                        <p><strong>Verification ID:</strong> ${verification._id}</p>
                        <p><strong>Verified Date:</strong> ${new Date(verification.verifiedAt || verification.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="signature">
                        <p>Verified by: ${verification.verifiedBy || 'PetConnect Team'}</p>
                        <p>PetConnect - Official Breed Verification Authority</p>
                    </div>
                    <div class="footer">
                        This certificate is digitally verified and authentic.
                    </div>
                </div>
            </body>
            </html>
        `;

        // Create blob and download
        const blob = new Blob([certificateContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${verification.petName}_breed_certificate.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'verified': 
                return <span className="badge bg-success">✅ Verified</span>;
            case 'rejected': 
                return <span className="badge bg-danger">❌ Rejected</span>;
            default: 
                return <span className="badge bg-warning">⏳ Pending</span>;
        }
    };

    const getAnimalIcon = (type) => {
        switch(type) {
            case 'dog': return '🐕';
            case 'cat': return '🐈';
            case 'bird': return '🐦';
            case 'rabbit': return '🐇';
            default: return '🐾';
        }
    };

    if (loading) return <div className="text-center py-5"><h4>Loading...</h4></div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4">🐕 Breed Verification</h2>
            
            <div className="row">
                {/* Submit Form */}
                <div className="col-md-6">
                    <div className="card p-3">
                        <h4>Submit for Verification</h4>
                        <form onSubmit={handleSubmit}>
                            
                            {/* Animal Type Selection */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">Select Animal Type *</label>
                                <div className="row">
                                    {animalTypes.map(animal => (
                                        <div key={animal.value} className="col-md-6 mb-2">
                                            <div 
                                                className={`border rounded p-2 text-center ${formData.animalType === animal.value ? 'bg-primary text-white' : 'bg-light'}`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setFormData({...formData, animalType: animal.value})}
                                            >
                                                <span style={{ fontSize: '24px' }}>{animal.icon}</span>
                                                <div>{animal.label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pet Name */}
                            <div className="mb-3">
                                <label className="form-label">Pet Name *</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    placeholder="Enter your pet's name"
                                    value={formData.petName}
                                    onChange={(e) => setFormData({...formData, petName: e.target.value})}
                                    required
                                />
                            </div>

                            {/* Breed Selection */}
                            {formData.animalType && (
                                <div className="mb-3">
                                    <label className="form-label">Breed *</label>
                                    {breedOptions.length > 0 ? (
                                        <select 
                                            className="form-select"
                                            value={formData.breed}
                                            onChange={(e) => setFormData({...formData, breed: e.target.value})}
                                            required
                                        >
                                            <option value="">Select {animalTypes.find(a => a.value === formData.animalType)?.label} breed</option>
                                            {breedOptions.map(breed => (
                                                <option key={breed} value={breed}>{breed}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            placeholder="Enter breed name"
                                            value={formData.breed}
                                            onChange={(e) => setFormData({...formData, breed: e.target.value})}
                                            required
                                        />
                                    )}
                                </div>
                            )}

                            {/* Images */}
                            <div className="mb-3">
                                <label className="form-label">Pet Images (URLs)</label>
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        placeholder="Image URL"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                    />
                                    <button type="button" className="btn btn-secondary" onClick={addImage}>
                                        Add
                                    </button>
                                </div>
                                {formData.images.length > 0 && (
                                    <div className="mt-2">
                                        <small>Added images: </small>
                                        {formData.images.map((img, idx) => (
                                            <span key={idx} className="badge bg-info me-1" style={{ cursor: 'pointer' }} onClick={() => removeImage(idx)}>
                                                Image {idx + 1} ✕
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary w-100">
                                Submit Verification
                            </button>
                        </form>
                    </div>
                </div>

                {/* Verification History */}
                <div className="col-md-6">
                    <div className="card p-3">
                        <h4>Verification History</h4>
                        {verifications.length === 0 ? (
                            <p className="text-muted">No verification requests yet</p>
                        ) : (
                            verifications.map(v => (
                                <div key={v._id} className="border-bottom pb-2 mb-2">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <strong>{getAnimalIcon(v.animalType)} {v.petName}</strong>
                                            <span className="ms-2 text-muted">({v.animalType})</span>
                                        </div>
                                        {getStatusBadge(v.status)}
                                    </div>
                                    <p className="mb-1">Breed: {v.breed}</p>
                                    <small className="text-muted">
                                        Submitted: {new Date(v.createdAt).toLocaleDateString()}
                                    </small>
                                    
                                    {/* Download Certificate Button - Only show when verified */}
                                    {v.status === 'verified' && (
                                        <div className="mt-2">
                                            <button 
                                                className="btn btn-sm btn-success"
                                                onClick={() => downloadCertificate(v)}
                                            >
                                                📄 Download Certificate
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* Show rejection reason if rejected */}
                                    {v.status === 'rejected' && v.verificationNotes && (
                                        <div className="mt-1 text-danger small">
                                            Reason: {v.verificationNotes}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="alert alert-info mt-3">
                <strong>ℹ️ How it works:</strong>
                <ul className="mb-0 mt-1">
                    <li>Select your animal type (Dog, Cat, Bird, Rabbit, or Other)</li>
                    <li>Choose breed from the list or enter manually</li>
                    <li>Upload clear photos showing your pet</li>
                    <li>Our team will verify within 24-48 hours</li>
                    <li>Once verified, you can download the official certificate</li>
                </ul>
            </div>
        </div>
    );
}

export default BreedVerification;
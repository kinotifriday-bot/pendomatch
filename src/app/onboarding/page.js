"use client";
import { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [data, setData] = useState({ bio: "", interests: [], intent: "", profilePic: "" });
  const router = useRouter();

  const interestsList = [
    "Music", "Travel", "Gaming", "Fitness", "Cooking", 
    "Art", "Movies", "Photography", "Tech", "Hiking", 
    "Reading", "Fashion", "Sports", "Volunteering"
  ];

  // Load existing data if it exists (for Profile Editing)
  useEffect(() => {
    const loadData = async () => {
      if (auth.currentUser) {
        const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          setData({
            bio: fetchedData.bio || "",
            interests: fetchedData.interests || [],
            intent: fetchedData.intent || "",
            profilePic: fetchedData.profilePic || ""
          });
          if (fetchedData.profilePic) {
            setImagePreview(fetchedData.profilePic);
          }
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleInterest = (i) => {
    setData(prev => ({
      ...prev,
      interests: prev.interests.includes(i) 
        ? prev.interests.filter(x => x !== i) 
        : [...prev.interests, i]
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const saveProfile = async () => {
    if (!auth.currentUser) return;
    setUploadingImage(true);

    try {
      let finalImageUrl = data.profilePic;

      // Upload image if a new file was chosen
      if (imageFile) {
        const imageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}/main.jpg`);
        await uploadBytes(imageRef, imageFile);
        finalImageUrl = await getDownloadURL(imageRef);
      }

      // Update document completely inside Firestore
      await updateDoc(doc(db, "users", auth.currentUser.uid), { 
        ...data, 
        profilePic: finalImageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60", // clean default fallback
        profileComplete: true 
      });
      
      // FIXED: Lowercase route matching to prevent case-sensitive server bugs on Linux deployment
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading Data...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
        
        {/* Step 1: Bio */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-rose-500">About You</h2>
            <p className="text-xs text-slate-400">Tell everyone a little bit about yourself.</p>
            <textarea 
              value={data.bio}
              onChange={(e) => setData({...data, bio: e.target.value})}
              placeholder="Write a catchy bio..."
              className="w-full h-32 p-4 bg-slate-950 rounded-xl border border-slate-700 outline-none focus:border-rose-500 text-white resize-none"
            />
            <button 
              disabled={!data.bio.trim()}
              onClick={() => setStep(2)} 
              className="w-full py-3 bg-rose-600 disabled:opacity-50 disabled:pointer-events-none rounded-xl font-black transition active:scale-[0.99]"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-rose-500">Hobbies</h2>
            <p className="text-xs text-slate-400">Select what you love to do.</p>
            <div className="grid grid-cols-2 gap-2 h-64 overflow-y-auto pr-2">
              {interestsList.map(i => (
                <button key={i} onClick={() => toggleInterest(i)} 
                  className={`p-3 rounded-xl text-xs font-bold border transition active:scale-[0.98] ${data.interests.includes(i) ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                  {i}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="w-1/3 py-3 bg-slate-800 rounded-xl font-bold border border-slate-700">Back</button>
              <button 
                disabled={data.interests.length === 0} 
                onClick={() => setStep(3)} 
                className="w-2/3 py-3 bg-rose-600 disabled:opacity-50 disabled:pointer-events-none rounded-xl font-black transition active:scale-[0.99]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Intent */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-rose-500">Looking For?</h2>
            <p className="text-xs text-slate-400">Honesty leads to better matches.</p>
            <div className="space-y-2">
              {["Short-term Fun", "Long-term Relationship", "Just Friends", "Still figuring it out"].map(opt => (
                <button key={opt} onClick={() => setData({...data, intent: opt})}
                  className={`w-full py-4 rounded-xl border font-bold text-sm transition active:scale-[0.99] ${data.intent === opt ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep(2)} className="w-1/3 py-3 bg-slate-800 rounded-xl font-bold border border-slate-700">Back</button>
              <button 
                disabled={!data.intent} 
                onClick={() => setStep(4)} 
                className="w-2/3 py-3 bg-rose-600 disabled:opacity-50 disabled:pointer-events-none rounded-xl font-black transition active:scale-[0.99]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Profile Image Upload Slot */}
        {step === 4 && (
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-black text-rose-500">Add Your Photo</h2>
            <p className="text-xs text-slate-400">Show off your best side to start matching.</p>
            
            <div className="flex justify-center my-4">
              <div className="relative w-40 h-40 rounded-full border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center bg-slate-950">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-500 text-center px-4">No picture chosen</span>
                )}
              </div>
            </div>

            <label className="block w-full text-center py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl font-bold text-sm cursor-pointer transition">
              Choose Profile Picture
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="hidden" 
              />
            </label>

            <div className="flex gap-2 mt-6">
              <button 
                disabled={uploadingImage} 
                onClick={() => setStep(3)} 
                className="w-1/3 py-3 bg-slate-800 rounded-xl font-bold border border-slate-700 disabled:opacity-50"
              >
                Back
              </button>
              <button 
                disabled={uploadingImage || (!imageFile && !data.profilePic)} 
                onClick={saveProfile} 
                className="w-2/3 py-3 bg-gradient-to-r from-rose-500 to-pink-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 rounded-xl font-black transition active:scale-[0.99]"
              >
                {uploadingImage ? "Uploading..." : "Save Profile 💖"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import {
  Heart,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  AlertCircle,
  MapPin,
  User,
  Package,
  BookOpen,
  Play,
  Upload,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import type { PersonalMemory, PersonalMemoryConsent } from '@/types';
import {
  getParticipantMemories,
  saveParticipantMemories,
  getParticipantConsent,
  saveParticipantConsent,
} from '@/lib/memoriesService';
import {
  uploadMemoryPhoto,
  fetchUserMemories,
  saveUserMemory,
  deleteUserMemory,
  fetchUserConsent,
  saveUserConsent as saveFirestoreConsent,
} from '@/lib/firebaseService';
import type { LinkedParticipant } from '@/lib/caregiverData';

interface MyMemoriesCaregiverTabProps {
  participant: LinkedParticipant;
  onPreviewActivity?: () => void;
}

const PRESET_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    title: 'Garden Walk with Family',
  },
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    title: 'Peaceful Mountain Trail',
  },
  {
    url: 'https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?w=600&auto=format&fit=crop&q=80',
    title: 'Traditional Silk Weaving Courtyard',
  },
  {
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80',
    title: 'Tea Garden in Morning Light',
  },
];

export function MyMemoriesCaregiverTab({
  participant,
  onPreviewActivity,
}: MyMemoriesCaregiverTabProps) {
  const [memories, setMemories] = useState<PersonalMemory[]>([]);
  const [consent, setConsent] = useState<PersonalMemoryConsent>({
    participant_id: participant.id,
    has_consent: false,
    consent_given_by: '',
    consent_date: '',
    notes: '',
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form State
  const [personName, setPersonName] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [objectName, setObjectName] = useState('');
  const [memoryText, setMemoryText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isApproved, setIsApproved] = useState(true);
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  // Load participant memories and consent from Firestore and cache
  useEffect(() => {
    let isMounted = true;

    const loadAsync = async () => {
      // Fast initial cache load
      const cachedMemories = getParticipantMemories(participant.id);
      const cachedConsent = getParticipantConsent(participant.id);
      if (isMounted) {
        setMemories(cachedMemories);
        setConsent(cachedConsent);
      }

      // Live Firestore sync
      try {
        const [cloudMemories, cloudConsent] = await Promise.all([
          fetchUserMemories(participant.id),
          fetchUserConsent(participant.id),
        ]);

        if (isMounted) {
          if (cloudMemories && cloudMemories.length > 0) {
            setMemories(cloudMemories);
            saveParticipantMemories(participant.id, cloudMemories);
          }
          if (cloudConsent) {
            setConsent(cloudConsent);
            saveParticipantConsent(cloudConsent);
          }
        }
      } catch (err) {
        console.warn('Firestore memories load note:', err);
      }
    };

    loadAsync();

    return () => {
      isMounted = false;
    };
  }, [participant.id]);

  const handleToggleConsent = async () => {
    const next: PersonalMemoryConsent = {
      participant_id: participant.id,
      has_consent: !consent.has_consent,
      consent_given_by: participant.primaryCaregiverName || 'Caregiver',
      consent_date: new Date().toISOString().split('T')[0],
      notes: 'Caregiver updated consent settings in Recallia portal.',
    };
    setConsent(next);
    saveParticipantConsent(next);

    try {
      await saveFirestoreConsent(participant.id, next);
    } catch (err) {
      console.warn('Firestore consent save note:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setPersonName('');
    setPlaceName('');
    setObjectName('');
    setMemoryText('');
    setPhotoUrl('');
    setIsApproved(true);
    setConsentConfirmed(consent.has_consent);
    setUploadSuccess(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: PersonalMemory) => {
    setEditingId(m.id);
    setPersonName(m.person_name);
    setPlaceName(m.place_name);
    setObjectName(m.object_name);
    setMemoryText(m.memory_text);
    setPhotoUrl(m.photo_url || '');
    setIsApproved(m.is_approved);
    setConsentConfirmed(true);
    setUploadSuccess(false);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    const filtered = memories.filter((m) => m.id !== id);
    setMemories(filtered);
    saveParticipantMemories(participant.id, filtered);

    try {
      await deleteUserMemory(participant.id, id);
    } catch (err) {
      console.warn('Firestore delete note:', err);
    }
  };

  const handleToggleApproval = async (id: string) => {
    const updated = memories.map((m) =>
      m.id === id ? { ...m, is_approved: !m.is_approved } : m
    );
    setMemories(updated);
    saveParticipantMemories(participant.id, updated);

    const target = updated.find((m) => m.id === id);
    if (target) {
      try {
        await saveUserMemory(participant.id, target);
      } catch (err) {
        console.warn('Firestore memory toggle note:', err);
      }
    }
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !placeName.trim() || !objectName.trim() || !memoryText.trim()) {
      return;
    }

    // If caregiver confirmed consent in the form, ensure consent is saved
    if (consentConfirmed && !consent.has_consent) {
      const newConsent: PersonalMemoryConsent = {
        participant_id: participant.id,
        has_consent: true,
        consent_given_by: participant.primaryCaregiverName || 'Caregiver',
        consent_date: new Date().toISOString().split('T')[0],
        notes: 'Consent confirmed during memory addition.',
      };
      setConsent(newConsent);
      saveParticipantConsent(newConsent);
      saveFirestoreConsent(participant.id, newConsent).catch(console.warn);
    }

    if (editingId) {
      const updatedMem: PersonalMemory = {
        id: editingId,
        participant_id: participant.id,
        person_name: personName.trim(),
        place_name: placeName.trim(),
        object_name: objectName.trim(),
        memory_text: memoryText.trim(),
        photo_url: photoUrl.trim() || undefined,
        is_approved: isApproved,
        updated_at: new Date().toISOString(),
        created_at: memories.find((m) => m.id === editingId)?.created_at || new Date().toISOString(),
      };

      const next = memories.map((m) => (m.id === editingId ? updatedMem : m));
      setMemories(next);
      saveParticipantMemories(participant.id, next);
      saveUserMemory(participant.id, updatedMem).catch(console.warn);
    } else {
      const newMem: PersonalMemory = {
        id: 'mem_' + Math.random().toString(36).substring(2, 9),
        participant_id: participant.id,
        person_name: personName.trim(),
        place_name: placeName.trim(),
        object_name: objectName.trim(),
        memory_text: memoryText.trim(),
        photo_url: photoUrl.trim() || undefined,
        is_approved: isApproved,
        created_at: new Date().toISOString(),
      };
      const next = [newMem, ...memories];
      setMemories(next);
      saveParticipantMemories(participant.id, next);
      saveUserMemory(participant.id, newMem).catch(console.warn);
    }

    setShowAddModal(false);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setUploadSuccess(false);

    try {
      // Upload directly to Firebase Storage bucket
      const storageUrl = await uploadMemoryPhoto(participant.id, file, file.name);
      setPhotoUrl(storageUrl);
      setUploadSuccess(true);
    } catch (err) {
      console.warn('Firebase Storage upload warning, using local file preview fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
          setUploadSuccess(true);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <section className="mt-8 animate-fade-in-up">
      <div className="card border-2 border-teal-200 bg-white p-6 sm:p-8 shadow-soft">
        {/* Header with Title and Add Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-teal-100 pb-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral-100 text-coral-600">
              <Heart className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-950">
                  My Memories (Personalized Content)
                </h2>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200">
                  Optional Feature
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-teal-600">
                Create personalized, familiar recall activities for {participant.name} using real family memories.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onPreviewActivity && memories.length > 0 && consent.has_consent && (
              <button
                onClick={onPreviewActivity}
                className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-bold text-teal-800 transition-all hover:bg-teal-100 shadow-xs"
                title="Preview personal memory recall activity"
              >
                <Play className="h-3.5 w-3.5 text-teal-600" />
                <span>Test Recall Activity</span>
              </button>
            )}

            <button
              onClick={handleOpenAdd}
              className="btn-primary !px-4 !py-2.5 !text-xs sm:!text-sm font-bold inline-flex items-center gap-2 shadow-soft"
            >
              <Plus className="h-4 w-4" />
              <span>Add Memory</span>
            </button>
          </div>
        </div>

        {/* Consent & Privacy Status Banner */}
        <div className="mt-6 rounded-2xl border border-teal-100 bg-sand-50/80 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-teal-700 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-teal-950">
                    Consent & Privacy Status:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      consent.has_consent
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sand-200 text-sand-800'
                    }`}
                  >
                    {consent.has_consent ? '✓ Consent Active' : 'Consent Required'}
                  </span>
                </div>
                <p className="text-xs text-teal-800 font-medium">
                  {consent.has_consent
                    ? `Consent recorded on ${consent.consent_date || 'recently'}. Personal memories will be used in private recall activities.`
                    : 'Caregiver or user consent is required before memories are presented in recall activities.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleConsent}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                consent.has_consent
                  ? 'bg-teal-100 text-teal-900 hover:bg-teal-200'
                  : 'bg-teal-700 text-white hover:bg-teal-800 shadow-xs'
              }`}
            >
              {consent.has_consent ? 'Modify Consent' : 'Grant Consent'}
            </button>
          </div>
        </div>

        {/* Memories Cards Grid */}
        <div className="mt-6">
          {memories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-teal-200 p-8 text-center bg-teal-50/20">
              <BookOpen className="mx-auto h-10 w-10 text-teal-400 mb-2" />
              <h3 className="font-display text-base font-bold text-teal-900">
                No personalized memories added yet
              </h3>
              <p className="mt-1 text-xs text-teal-600 max-w-md mx-auto">
                Add familiar names (e.g. a grandchild), favorite places, and beloved objects to create gentle, personalized recall activities.
              </p>
              <button
                onClick={handleOpenAdd}
                className="btn-primary !px-4 !py-2 !text-xs font-bold mt-4 inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Memory
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                    m.is_approved
                      ? 'border-teal-200 bg-white shadow-soft'
                      : 'border-slate-200 bg-slate-50/80 opacity-75'
                  }`}
                >
                  <div>
                    {/* Optional Photo */}
                    {m.photo_url && (
                      <div className="mb-3.5 h-36 w-full overflow-hidden rounded-xl bg-teal-50 border border-teal-100">
                        <img
                          src={m.photo_url}
                          alt={m.person_name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Tags for Person, Place, Object */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-teal-950">
                        <User className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{m.person_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-teal-800">
                        <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{m.place_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-teal-800">
                        <Package className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{m.object_name}</span>
                      </div>
                    </div>

                    {/* Short Personal Memory */}
                    <p className="mt-3 text-xs italic text-teal-900 leading-relaxed bg-sand-50 p-3 rounded-xl border border-teal-50">
                      "{m.memory_text}"
                    </p>
                  </div>

                  {/* Actions & Approval toggle */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleApproval(m.id)}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-lg px-2.5 py-1 transition-colors ${
                        m.is_approved
                          ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                      title="Toggle active inclusion in recall activities"
                    >
                      {m.is_approved ? '✓ Included in Recall' : 'Excluded'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Edit memory"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strictly Non-Diagnostic Safe Care Notice */}
        <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-sand-100 px-5 py-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
          <p className="text-xs leading-relaxed text-teal-800">
            <strong>Non-Diagnostic Commitment:</strong> Personal memory content is intended solely for familiar connection and gentle reminiscence. Recallia does not treat, cure, or diagnose dementia or cognitive impairments.
          </p>
        </div>
      </div>

      {/* Add / Edit Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-soft-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-teal-100">
              <h3 className="font-display text-xl font-bold text-teal-950">
                {editingId ? 'Edit Personal Memory' : 'Add New Personal Memory'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="mt-4 space-y-4">
              {/* Person's Name */}
              <div>
                <label className="block text-xs font-bold text-teal-900">
                  Familiar Person's Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Granddaughter Maya, Brother Anand, Sister Sunita"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="input-field mt-1 !py-2.5 !text-sm"
                />
              </div>

              {/* Important Place */}
              <div>
                <label className="block text-xs font-bold text-teal-900">
                  Important / Familiar Place *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kaziranga Orchid Garden, Shillong Pine Trail, Old Courtyard"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  className="input-field mt-1 !py-2.5 !text-sm"
                />
              </div>

              {/* Familiar Object */}
              <div>
                <label className="block text-xs font-bold text-teal-900">
                  Familiar Object / Keepsake *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bamboo Tea Cup, Silver Pocket Watch, Golden Silk Shawl"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                  className="input-field mt-1 !py-2.5 !text-sm"
                />
              </div>

              {/* Short Personal Memory */}
              <div>
                <label className="block text-xs font-bold text-teal-900">
                  Short Personal Memory (1-2 sentences) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Maya held my hand as we walked through the orchid garden in bloom, sipping warm tea from fresh bamboo cups."
                  value={memoryText}
                  onChange={(e) => setMemoryText(e.target.value)}
                  className="input-field mt-1 !py-2.5 !text-sm"
                />
              </div>

              {/* Optional Photo URL / Picker */}
              <div>
                <label className="block text-xs font-bold text-teal-900 mb-1">
                  Optional Photo (Image URL or Choose Preset)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://... or choose preset below"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="input-field !py-2 !text-xs flex-1"
                  />
                  <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                    uploadingPhoto
                      ? 'bg-teal-100 text-teal-700 border-teal-300 pointer-events-none'
                      : uploadSuccess
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-sand-100 hover:bg-sand-200 text-teal-900 border-teal-200'
                  }`}>
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-700" />
                        <span>Uploading...</span>
                      </>
                    ) : uploadSuccess ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload File</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingPhoto}
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadSuccess && (
                  <p className="mt-1 text-[11px] text-emerald-700 font-semibold">
                    ✓ Photo securely uploaded to Firebase Cloud Storage!
                  </p>
                )}

                {/* Preset Photo Quick Pick */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRESET_PHOTOS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoUrl(p.url)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                        photoUrl === p.url
                          ? 'bg-teal-700 text-white border-teal-800'
                          : 'bg-sand-50 hover:bg-teal-50 text-teal-900 border-teal-200'
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="text-[11px] px-2 py-1 text-rose-600 hover:underline"
                    >
                      Clear photo
                    </button>
                  )}
                </div>
              </div>

              {/* Consent Confirmation Checkbox */}
              <div className="pt-2 border-t border-teal-100">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-teal-300 text-teal-700 focus:ring-teal-500"
                  />
                  <span className="text-xs text-teal-900 font-medium leading-tight">
                    I confirm that the participant / family has consented to saving this personal memory for private recall activities.
                  </span>
                </label>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-teal-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!consentConfirmed}
                  className="btn-primary !px-5 !py-2.5 !text-sm font-bold disabled:opacity-50"
                >
                  {editingId ? 'Update Memory' : 'Save Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

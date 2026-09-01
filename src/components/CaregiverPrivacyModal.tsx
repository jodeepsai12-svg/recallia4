import { useState } from 'react';
import { ShieldCheck, Lock, Bell, Copy, Check, UserMinus, AlertCircle, X } from 'lucide-react';
import type { LinkedParticipant } from '@/lib/caregiverData';

interface CaregiverPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: LinkedParticipant;
  onUpdateParticipant?: (updated: LinkedParticipant) => void;
  onRevokeAccess?: () => void;
}

export function CaregiverPrivacyModal({
  isOpen,
  onClose,
  participant,
  onUpdateParticipant,
  onRevokeAccess,
}: CaregiverPrivacyModalProps) {
  const [copied, setCopied] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(participant.emailAlerts);
  const [inactivityAlerts, setInactivityAlerts] = useState(participant.inactivityAlerts);
  const [milestoneAlerts, setMilestoneAlerts] = useState(participant.milestoneAlerts);
  const [accessLevel, setAccessLevel] = useState(participant.accessLevel);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(participant.accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSavePreferences = () => {
    if (onUpdateParticipant) {
      onUpdateParticipant({
        ...participant,
        emailAlerts,
        inactivityAlerts,
        milestoneAlerts,
        accessLevel,
      });
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/40 p-4 backdrop-blur-sm animate-fade-in">
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-soft-lg sm:p-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-teal-400 transition-colors hover:bg-teal-50 hover:text-teal-700"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-teal-900">
              Privacy & Caregiver Access
            </h2>
            <p className="text-sm font-semibold text-teal-500">
              Manage data sharing permissions for {participant.name}
            </p>
          </div>
        </div>

        {/* Consent Status Card */}
        <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/60 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
              <Check className="h-4 w-4" strokeWidth={3} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-semibold text-teal-900">
                  Sharing Consent Active
                </span>
                <span className="rounded-full bg-teal-200/80 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                  Authorized
                </span>
              </div>
              <p className="mt-1 text-sm text-teal-700">
                Authorized by {participant.name} ({participant.relationship}) on{' '}
                {new Date(participant.consentDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                <Lock className="h-3.5 w-3.5" />
                <span>Read-only cognitive exercise summaries & engagement patterns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Access Code Section */}
        <div className="mt-6">
          <label className="block text-sm font-bold text-teal-800">
            Caregiver Access Code
          </label>
          <p className="mt-1 text-xs text-teal-500">
            Family members can link their caregiver account using this secure one-time code.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 rounded-2xl border-2 border-dashed border-teal-200 bg-sand-50 px-4 py-3 font-mono text-base font-bold tracking-wider text-teal-900">
              {participant.accessCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-teal-200 bg-white px-4 py-3 text-sm font-bold text-teal-700 transition-colors hover:bg-teal-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-teal-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-teal-600" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Access Level Selector */}
        <div className="mt-6">
          <label className="block text-sm font-bold text-teal-800">
            Caregiver View Scope
          </label>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAccessLevel('full')}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                accessLevel === 'full'
                  ? 'border-teal-600 bg-teal-50/50'
                  : 'border-teal-100 bg-white hover:border-teal-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-teal-900">Full Activity & Trends</span>
                {accessLevel === 'full' && <Check className="h-4 w-4 text-teal-600" />}
              </div>
              <p className="mt-1 text-xs text-teal-600">
                View all session logs, accuracy trends, category breakdowns, and non-diagnostic insights.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAccessLevel('summary_only')}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                accessLevel === 'summary_only'
                  ? 'border-teal-600 bg-teal-50/50'
                  : 'border-teal-100 bg-white hover:border-teal-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-teal-900">Weekly Summary Only</span>
                {accessLevel === 'summary_only' && <Check className="h-4 w-4 text-teal-600" />}
              </div>
              <p className="mt-1 text-xs text-teal-600">
                View only high-level completed session counts and weekly active day summaries.
              </p>
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="mt-6 border-t border-teal-100 pt-6">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-teal-600" />
            <h3 className="font-display text-base font-semibold text-teal-900">
              Notification & Digest Settings
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-2xl bg-sand-50 p-3.5 transition-colors hover:bg-sand-100">
              <div>
                <span className="text-sm font-bold text-teal-900">Weekly Caregiver Email Digest</span>
                <p className="text-xs text-teal-600">Receive a weekly summary of completed cognitive sessions</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-5 w-5 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl bg-sand-50 p-3.5 transition-colors hover:bg-sand-100">
              <div>
                <span className="text-sm font-bold text-teal-900">Inactivity Reminders</span>
                <p className="text-xs text-teal-600">Notify if no exercises are recorded for 3 consecutive days</p>
              </div>
              <input
                type="checkbox"
                checked={inactivityAlerts}
                onChange={(e) => setInactivityAlerts(e.target.checked)}
                className="h-5 w-5 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl bg-sand-50 p-3.5 transition-colors hover:bg-sand-100">
              <div>
                <span className="text-sm font-bold text-teal-900">Milestone Celebrations</span>
                <p className="text-xs text-teal-600">Celebrate streaks and completed cognitive activity milestones</p>
              </div>
              <input
                type="checkbox"
                checked={milestoneAlerts}
                onChange={(e) => setMilestoneAlerts(e.target.checked)}
                className="h-5 w-5 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
              />
            </label>
          </div>
        </div>

        {/* Revoke Access Section */}
        <div className="mt-6 border-t border-teal-100 pt-6">
          {!showRevokeConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-teal-900">Revoke Caregiver Access</span>
                <p className="text-xs text-teal-500">Disconnect this caregiver dashboard from {participant.name}&apos;s profile</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRevokeConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-coral-200 bg-coral-50/50 px-3.5 py-2 text-xs font-bold text-coral-600 transition-colors hover:bg-coral-100"
              >
                <UserMinus className="h-4 w-4" />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-coral-200 bg-coral-50 p-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral-600" />
                <div>
                  <h4 className="text-sm font-bold text-coral-900">
                    Are you sure you want to disconnect caregiver access?
                  </h4>
                  <p className="mt-1 text-xs text-coral-700">
                    This will remove your caregiver linkage to {participant.name}. A new consent authorization or access code will be required to reconnect.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onRevokeAccess) onRevokeAccess();
                        onClose();
                      }}
                      className="rounded-xl bg-coral-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-coral-700"
                    >
                      Yes, Revoke Access
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRevokeConfirm(false)}
                      className="rounded-xl border border-coral-200 bg-white px-4 py-1.5 text-xs font-bold text-coral-700 hover:bg-coral-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-teal-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-teal-200 bg-white px-5 py-2.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSavePreferences}
            className="btn-primary !px-6 !py-2.5 !text-sm"
          >
            {savedSuccess ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}

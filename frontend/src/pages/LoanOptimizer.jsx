import React, { useState, useEffect } from 'react';
import { Calculator, Zap, ArrowRight, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateLoan, simulatePrepayment, getLoans, extractLoans, syncGmail } from '../api/client';
import { clsx } from 'clsx';

const LoanOptimizer = () => {
    const [activeTab, setActiveTab] = useState('calculate');
    const [calcData, setCalcData] = useState({ principal: '', rate: '', tenureMonths: '' });
    const [simData, setSimData] = useState({
        principal: '', rate: '', tenureMonths: '', currentEmi: '',
        prepaymentAmount: '', prepaymentFrequency: 'monthly'
    });
    const [calcResult, setCalcResult] = useState(null);
    const [simResult, setSimResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [detectedLoans, setDetectedLoans] = useState([]);
    const [loadingLoans, setLoadingLoans] = useState(false);
    const [emailsAnalyzed, setEmailsAnalyzed] = useState(0);

    useEffect(() => {
        fetchDetectedLoans();
    }, []);

    const fetchDetectedLoans = async () => {
        setLoadingLoans(true);
        try {
            const { data } = await getLoans();
            setDetectedLoans(data.loans || []);

            // Auto-fill first loan if available
            if (data.loans && data.loans.length > 0) {
                const loan = data.loans[0];
                setCalcData({
                    principal: loan.outstanding_balance || loan.principal_amount || '',
                    rate: loan.interest_rate || '',
                    tenureMonths: loan.remaining_tenure_months || loan.tenure_months || ''
                });
                toast.success(`Auto-filled with ${loan.lender_name || 'detected'} loan data`);
            }
        } catch (error) {
            console.error('Failed to fetch loans:', error);
        } finally {
            setLoadingLoans(false);
        }
    };

    const handleExtractLoans = async () => {
        setLoadingLoans(true);
        setEmailsAnalyzed(0);
        try {
            // Step 1: Sync Gmail
            toast.loading('Syncing latest emails...', { id: 'loan-scan' });
            await syncGmail();

            // Step 2: Extract Loans
            toast.loading('Analyzing emails for loans...', { id: 'loan-scan' });
            const { data } = await extractLoans();

            if (data.count > 0) {
                toast.success(`Found ${data.count} loan(s)!`, { id: 'loan-scan' });
                setTimeout(() => fetchDetectedLoans(), 1000);
            } else {
                toast.error('No new loan statements found in recent emails.', { id: 'loan-scan' });
            }
        } catch (error) {
            console.error('Extract error:', error);
            const msg = error.response?.data?.error || 'Scan failed. Ensure you are logged in with Google.';
            toast.error(msg, { id: 'loan-scan' });
        } finally {
            setLoadingLoans(false);
        }
    };

    const handleCalculate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                principal: Number(calcData.principal),
                rate: Number(calcData.rate),
                tenureMonths: Number(calcData.tenureMonths)
            };
            const { data } = await calculateLoan(payload);
            setCalcResult(data);
            // Autofill sim data from calc result for convenience
            setSimData(prev => ({
                ...prev,
                principal: calcData.principal,
                rate: calcData.rate,
                tenureMonths: calcData.tenureMonths,
                currentEmi: data.emi
            }));
        } catch (error) {
            console.error(error);
            toast.error('Calculation Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSimulate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                principal: Number(simData.principal),
                rate: Number(simData.rate),
                tenureMonths: Number(simData.tenureMonths),
                currentEmi: Number(simData.currentEmi),
                prepaymentAmount: Number(simData.prepaymentAmount),
                prepaymentFrequency: simData.prepaymentFrequency
            };
            const { data } = await simulatePrepayment(payload);
            setSimResult(data);
        } catch (error) {
            console.error(error);
            toast.error('Simulation Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-ink-900 italic mb-2">Loan Optimizer</h1>
                    <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-ink-500">Optimus Engine v1.0</p>
                </div>
                <button
                    onClick={handleExtractLoans}
                    disabled={loadingLoans}
                    className="px-4 py-2 bg-accent text-ink-900 rounded-md font-bold text-xs uppercase tracking-wider hover:bg-accent-dark transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <RefreshCw className={clsx("w-4 h-4", loadingLoans && "animate-spin")} />
                    {loadingLoans ? 'Scanning...' : 'Scan Emails'}
                </button>
            </div>

            {/* Detected Loans Banner */}
            {detectedLoans.length > 0 && (
                <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg space-y-3">
                    <p className="text-sm font-bold text-green-900 mb-3">
                        ✓ {detectedLoans.length} loan(s) detected from your emails
                    </p>
                    {detectedLoans.map((loan, idx) => (
                        <div key={idx} className="p-3 bg-white rounded border border-green-100 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-bold text-ink-500">Lender:</span> {loan.lender_name || 'Unknown'}
                                </div>
                                <div>
                                    <span className="font-bold text-ink-500">Type:</span> {loan.loan_type || 'N/A'}
                                </div>
                                <div>
                                    <span className="font-bold text-ink-500">EMI:</span> ₹{loan.emi_amount?.toLocaleString('en-IN') || 'N/A'}
                                </div>
                                <div>
                                    <span className="font-bold text-ink-500">Rate:</span> {loan.interest_rate || 'N/A'}% p.a.
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-line pb-1">
                <button
                    onClick={() => setActiveTab('calculate')}
                    className={clsx(
                        "pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2",
                        activeTab === 'calculate' ? "border-ink-900 text-ink-900" : "border-transparent text-ink-300 hover:text-ink-500"
                    )}
                >
                    EMI Calculator
                </button>
                <button
                    onClick={() => setActiveTab('simulate')}
                    className={clsx(
                        "pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2",
                        activeTab === 'simulate' ? "border-ink-900 text-ink-900" : "border-transparent text-ink-300 hover:text-ink-500"
                    )}
                >
                    Prepayment Simulator
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Form Section */}
                <div className="bg-white p-8 rounded-lg shadow-sm border border-line">
                    <h2 className="font-sans font-bold text-lg text-ink-900 mb-6 flex items-center gap-2">
                        {activeTab === 'calculate' ? <Calculator className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                        {activeTab === 'calculate' ? 'Loan Details' : 'Optimization Strategy'}
                    </h2>

                    {activeTab === 'calculate' ? (
                        <form onSubmit={handleCalculate} className="space-y-6">
                            <div className="group">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Principal Amount (₹)</label>
                                <input type="number" value={calcData.principal} onChange={e => setCalcData({ ...calcData, principal: e.target.value })} className="input-field" placeholder="e.g. 5000000" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Interest Rate (% p.a)</label>
                                    <input type="number" step="0.1" value={calcData.rate} onChange={e => setCalcData({ ...calcData, rate: e.target.value })} className="input-field" placeholder="8.5" required />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Tenure (Months)</label>
                                    <input type="number" value={calcData.tenureMonths} onChange={e => setCalcData({ ...calcData, tenureMonths: e.target.value })} className="input-field" placeholder="240" required />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full flex justify-between items-center mt-4">
                                <span>Calculate EMI</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSimulate} className="space-y-6">
                            {/* Pre-filled likely but editable */}
                            <div className="group">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Existing Loan Balance (₹)</label>
                                <input type="number" value={simData.principal} onChange={e => setSimData({ ...simData, principal: e.target.value })} className="input-field" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Rate (%)</label>
                                    <input type="number" step="0.1" value={simData.rate} onChange={e => setSimData({ ...simData, rate: e.target.value })} className="input-field" required />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Remaining Tenure (Mos)</label>
                                    <input type="number" value={simData.tenureMonths} onChange={e => setSimData({ ...simData, tenureMonths: e.target.value })} className="input-field" required />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Current EMI (₹)</label>
                                <input type="number" value={simData.currentEmi} onChange={e => setSimData({ ...simData, currentEmi: e.target.value })} className="input-field" required />
                            </div>

                            <div className="p-4 bg-ink-50 rounded-md border border-ink-100 space-y-4">
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-900 mb-2">Prepayment Amount (₹)</label>
                                    <input type="number" value={simData.prepaymentAmount} onChange={e => setSimData({ ...simData, prepaymentAmount: e.target.value })} className="w-full bg-white border border-line px-3 py-2 text-ink-900 rounded-md" placeholder="e.g. 5000" required />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-900 mb-2">Frequency</label>
                                    <select value={simData.prepaymentFrequency} onChange={e => setSimData({ ...simData, prepaymentFrequency: e.target.value })} className="w-full bg-white border border-line px-3 py-2 text-ink-900 rounded-md">
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="one-time">One Time</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary w-full flex justify-between items-center mt-4 !bg-accent hover:!bg-accent-dark !text-ink-900">
                                <span>Simulate Impact</span>
                                <Zap className="w-4 h-4" />
                            </button>
                        </form>
                    )}
                </div>

                {/* Results Section */}
                <div>
                    {activeTab === 'calculate' && calcResult && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="bg-ink-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Monthly EMI</p>
                                    <h3 className="text-5xl font-serif font-bold italic">₹ {calcResult.emi.toLocaleString('en-IN')}</h3>
                                </div>
                                <div className="absolute right-0 bottom-0 opacity-10">
                                    <Calculator className="w-48 h-48 -mr-10 -mb-10" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-lg border border-line shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Total Interest</p>
                                    <p className="text-2xl font-bold text-ink-900">₹ {calcResult.totalInterest.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg border border-line shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Total Payable</p>
                                    <p className="text-2xl font-bold text-ink-900">₹ {calcResult.totalAmount.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'simulate' && simResult && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="bg-[#ecfccb] border border-[#d9f99d] p-8 rounded-2xl shadow-xl relative overflow-hidden">
                                <div className="relative z-10 text-ink-900">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingDown className="w-4 h-4 text-green-700" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-green-800">Interest Saved</p>
                                    </div>
                                    <h3 className="text-5xl font-serif font-bold italic text-green-900">₹ {simResult.interestSaved.toLocaleString('en-IN')}</h3>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-line shadow-sm relative">
                                <div className="flex items-center gap-2 mb-6">
                                    <Clock className="w-5 h-5 text-accent" />
                                    <h4 className="font-bold text-ink-900">Time Reduction</h4>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-ink-500 mb-1">
                                            <span>Original Tenure</span>
                                            <span>{simResult.originalTenure} Months</span>
                                        </div>
                                        <div className="h-2 bg-line rounded-full overflow-hidden">
                                            <div className="h-full bg-ink-200 w-full"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-ink-900 mb-1">
                                            <span>New Tenure</span>
                                            <span>{simResult.newTenure} Months</span>
                                        </div>
                                        <div className="h-2 bg-line rounded-full overflow-hidden">
                                            <div className="h-full bg-ink-900" style={{ width: `${(simResult.newTenure / simResult.originalTenure) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-line mt-4">
                                        <p className="text-sm font-medium text-ink-900">
                                            You will become debt-free <span className="font-bold text-green-700">{simResult.monthsSaved} months</span> earlier!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State placeholder if no results yet */}
                    {!calcResult && activeTab === 'calculate' && (
                        <div className="h-full flex items-center justify-center p-12 text-ink-300 border-2 border-dashed border-line rounded-2xl">
                            <p className="text-sm font-medium">Enter details to see projection</p>
                        </div>
                    )}
                    {!simResult && activeTab === 'simulate' && (
                        <div className="h-full flex items-center justify-center p-12 text-ink-300 border-2 border-dashed border-line rounded-2xl">
                            <p className="text-sm font-medium">Run simulation to see savings</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default LoanOptimizer;

import os
import sys

file_path = r"c:\Users\Azim\Desktop\FeedBackPro Full\FeedbackPro\src\components\surveys\SurveyBuilder.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    orig = f.read()

# Make Add + change
orig = orig.replace('<Plus className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />',
                    '<div className="flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-purple-500 transition-colors"><span>Add</span><Plus className="w-4 h-4" /></div>')

# Make Logics tab open properly
orig = orig.replace(
'''                        onClick={() => {
                          setActiveTab("builder");
                          setSelectedQuestion(q);
                          setShowLogic(true);
                        }}''',
'''                        onClick={() => {
                          setActiveTab("builder");
                          setCurrentPreviewQuestion(idx);
                          setShowLogic(true);
                        }}'''
)

# Update state references when deleting or adding questions
orig = orig.replace(
'''    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setSelectedQuestion(newQuestion);''',
'''    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setCurrentPreviewQuestion(survey.questions.length);'''
)

orig = orig.replace(
'''    if (selectedQuestion?.id === id) {
      setSelectedQuestion(null);
    }''',
'''    if (currentPreviewQuestion >= survey.questions.length - 1) {
      setCurrentPreviewQuestion(Math.max(0, survey.questions.length - 2));
    }'''
)

orig = orig.replace(
'''    if (selectedQuestion?.id === id) {
      setSelectedQuestion(prev => prev ? { ...prev, ...updates } : null);
    }''',
''
)

orig = orig.replace(
'''  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);''',
''
)


middle_marker = "        {/* Middle Section - Question List & Settings */}"
idx = orig.find(middle_marker)
if idx == -1:
    print("middle section not found!")
    sys.exit(1)

head = orig[:idx]

new_content = '''        {/* Right Section - Editable Live Preview (Replacing Middle & Right) */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Survey Editor</h3>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6">
              {/* Survey Header editable */}
              <div className="mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                <input
                  type="text"
                  value={survey.title}
                  onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
                  className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 w-full bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-purple-500 focus:outline-none transition-colors px-0 py-1"
                  placeholder="Survey Title"
                />
                <textarea
                  value={survey.description}
                  onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
                  className="text-sm sm:text-base text-gray-600 dark:text-gray-400 w-full bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-purple-500 focus:outline-none transition-colors resize-none px-0 py-1"
                  placeholder="Survey Description"
                  rows={2}
                />
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {survey.questions.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No questions yet</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">Click any element in the left sidebar to add your first question and start building your survey.</p>
                  </div>
                ) : (
                  survey.questions.map((question, qIdx) => {
                    const isActive = currentPreviewQuestion === qIdx;
                    return (
                      <div 
                        key={question.id} 
                        className={`p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200 ${isActive ? "border-purple-500 shadow-lg bg-white dark:bg-gray-800" : "border-transparent border-gray-100 dark:border-gray-700 hover:border-purple-300 bg-gray-50/50 dark:bg-gray-800/40 cursor-pointer"}`}
                        onClick={() => !isActive && setCurrentPreviewQuestion(qIdx)}
                      >
                        <div className="flex items-start justify-between gap-4 mb-5">
                          <div className="flex-1 flex gap-3 sm:gap-4">
                            <span className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? "bg-purple-600 text-white" : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"}`}>
                              {qIdx + 1}
                            </span>
                            <div className="flex-1">
                              {isActive ? (
                                <input
                                  type="text"
                                  value={question.title}
                                  onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                                  className="w-full text-lg sm:text-xl font-medium bg-transparent border-b border-gray-200 dark:border-gray-700 hover:border-gray-300 focus:border-purple-500 focus:outline-none pb-1"
                                  placeholder="Question Title"
                                />
                              ) : (
                                <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white">
                                  {question.title}
                                  {question.required && <span className="text-red-500 ml-1.5">*</span>}
                                </h3>
                              )}

                              {(isActive || question.description) && (
                                isActive ? (
                                  <textarea
                                    value={question.description || ""}
                                    onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                                    className="w-full mt-2 text-sm text-gray-600 dark:text-gray-400 bg-transparent border-b border-gray-200 dark:border-gray-700 hover:border-gray-300 focus:border-purple-500 focus:outline-none resize-none pb-1"
                                    placeholder="Description (Optional)"
                                    rows={1}
                                  />
                                ) : (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{question.description}</p>
                                )
                              )}
                            </div>
                          </div>
                          
                          {isActive && (
                            <div className="flex items-center gap-1.5 flex-shrink-0 border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 p-1 rounded-lg">
                              <button onClick={(e) => { e.stopPropagation(); moveQuestion(question.id, "up"); }} disabled={qIdx === 0} className="p-1.5 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded disabled:opacity-30"><ArrowLeft className="w-4 h-4 rotate-90" /></button>
                              <button onClick={(e) => { e.stopPropagation(); moveQuestion(question.id, "down"); }} disabled={qIdx === survey.questions.length - 1} className="p-1.5 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded disabled:opacity-30"><ArrowLeft className="w-4 h-4 -rotate-90" /></button>
                              <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                              <button onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }} className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </div>

                        {/* Interactive Preview Element */}
                        <div className="mt-4 pl-0 sm:pl-12">
                          {question.type === "short-text" && (
                            <input type="text" placeholder="Short text answer..." className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />
                          )}
                          {question.type === "long-text" && (
                            <textarea placeholder="Long text answer..." rows={3} className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />
                          )}
                          {(question.type === "multiple-choice" || question.type === "single-choice") && (
                            <div className="space-y-3">
                              {question.options?.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-3">
                                  {question.type === "multiple-choice" ? (
                                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded flex-shrink-0"></div>
                                  ) : (
                                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded-full flex-shrink-0"></div>
                                  )}
                                  {isActive ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <input 
                                        type="text" 
                                        value={opt} 
                                        onChange={(e) => updateOption(question.id, oIdx, e.target.value)}
                                        className="flex-1 px-3 py-1.5 text-base border-b border-transparent hover:border-gray-200 focus:border-purple-500 focus:outline-none bg-transparent"
                                      />
                                      {question.options!.length > 1 && (
                                        <button onClick={() => removeOption(question.id, oIdx)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"><X className="w-4 h-4" /></button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-700 py-1.5 dark:text-gray-300 text-base">{opt}</span>
                                  )}
                                </div>
                              ))}
                              {isActive && (
                                <button onClick={() => addOption(question.id)} className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-2 rounded-lg mt-3 font-medium transition-colors">
                                  <Plus className="w-4 h-4" /> Add Option
                                </button>
                              )}
                            </div>
                          )}
                          {question.type === "rating-scale" && (
                            <div className="space-y-4">
                              <div className="flex gap-2">
                                {Array.from({ length: question.ratingMax || 5 }, (_, i) => (
                                  <button key={i} disabled className="w-10 h-10 text-gray-300 dark:text-gray-600"><Star className="w-8 h-8" /></button>
                                ))}
                              </div>
                              {isActive && (
                                <div className="flex items-center gap-3 mt-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700 w-fit">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Max Rating:</span>
                                  <select 
                                    value={question.ratingMax || 5} 
                                    onChange={(e) => updateQuestion(question.id, { ratingMax: parseInt(e.target.value) })}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 font-medium"
                                  >
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                          {question.type === "date" && <input type="date" className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />}
                          {question.type === "email" && <input type="email" placeholder="Email address..." className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />}
                          {question.type === "phone" && <input type="tel" placeholder="Phone number..." className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />}
                          {question.type === "number" && <input type="number" placeholder="Numeric value..." className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />}
                        </div>
                        
                        {/* Settings & Logic Bar */}
                        {isActive && (
                          <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4 pl-0 sm:pl-12">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <span className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">Required Question</span>
                                <button onClick={() => updateQuestion(question.id, { required: !question.required })} className="flex items-center gap-2 outline-none">
                                  {question.required ? <ToggleRight className="w-8 h-8 text-purple-600" /> : <ToggleLeft className="w-8 h-8 text-gray-400 hover:text-gray-500" />}
                                </button>
                              </div>
                            </div>
                            
                            <button onClick={() => setShowLogic(!showLogic)} className={`text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${showLogic ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"}`}>
                              <Filter className="w-4 h-4" />
                              {showLogic ? "Hide Logic" : "Logic Rules"}
                            </button>
                          </div>
                        )}

                        {/* Logic Editor */}
                        {isActive && showLogic && (
                          <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pl-0 sm:pl-12">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Filter className="w-4 h-4 text-purple-500" />
                                Branching & Logic
                              </h4>
                            </div>
                            
                            {question.logic && question.logic.length > 0 ? (
                              <div className="space-y-3 mb-4">
                                {question.logic.map((rule, idx) => (
                                  <div key={rule.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm relative group">
                                    <div className="absolute -left-2 -top-2 w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full flex items-center justify-center text-xs font-bold border border-purple-200 dark:border-purple-700">
                                      {idx + 1}
                                    </div>
                                    <button onClick={() => removeLogicRule(question.id, rule.id)} className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 mt-1">
                                      <div>
                                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wide">If answer</label>
                                        <select value={rule.condition} onChange={(e) => updateLogicRule(question.id, rule.id, { condition: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700">
                                          <option value="equals">Equals</option>
                                          <option value="not_equals">Does Not Equal</option>
                                          <option value="contains">Contains</option>
                                          <option value="not_contains">Does Not Contain</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wide">Value</label>
                                        <input type="text" value={rule.value} onChange={(e) => updateLogicRule(question.id, rule.id, { value: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700" placeholder="Type answer value..." />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wide">Then</label>
                                        <select value={rule.action} onChange={(e) => updateLogicRule(question.id, rule.id, { action: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700">
                                          <option value="show">Show</option>
                                          <option value="hide">Hide</option>
                                          <option value="jump_to">Jump To</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wide">Target</label>
                                        <select value={rule.targetQuestion || ""} onChange={(e) => updateLogicRule(question.id, rule.id, { targetQuestion: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700">
                                          <option value="">Select Target...</option>
                                          {survey.questions.filter(q => q.id !== question.id).map(q => (
                                            <option key={q.id} value={q.id}>Q: {q.title}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl mb-4">
                                <Filter className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No logic rules assigned.</p>
                              </div>
                            )}
                            <button onClick={() => addLogicRule(question.id)} className="w-full text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-purple-300 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                              <Plus className="w-4 h-4" /> Add Logic Rule
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'''

with open(file_path, "w", encoding="utf-8") as f:
    f.write(head + new_content)

print("success!")

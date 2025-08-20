"use client"

import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faArrowRight, 
  faFileLines, 
  faCircleCheck, 
  faClock, 
  faUpload, 
  faEye, 
  faRotate, 
  faFolderOpen, 
  faCloudArrowUp,
  faXmark,
  faTrash,
  faCheck,
  faEllipsisVertical,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

interface DocumentUploadProps {
  onNext: () => void;
  onBack: () => void;
  formData: {
    documents: {
      id: string;
      name: string;
      uploaded: boolean;
      status: string;
      file?: File | null;
      isCustom?: boolean;
    }[];
    [key: string]: any;
  };
  updateFormData: (data: {
    documents: {
      id: string;
      name: string;
      uploaded: boolean;
      status: string;
      file?: File | null;
      isCustom?: boolean;
    }[];
  }) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onNext, onBack, formData, updateFormData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customDocName, setCustomDocName] = useState('');
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, docId: string | null = null) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (docId) {
      // Updating a specific document
      const updatedDocuments = formData.documents.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            file,
            uploaded: true,
            status: 'pending'
          };
        }
        return doc;
      });
      
      updateFormData({ documents: updatedDocuments });
    } else {
      // If no document ID specified, store the file and show the selector
      setDroppedFile(file);
      setShowDocumentSelector(true);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle file assignment to a specific document
  const handleAssignFileToDocument = (docId: string) => {
    if (!droppedFile) return;
    
    const updatedDocuments = formData.documents.map(doc => {
      if (doc.id === docId) {
        return {
          ...doc,
          file: droppedFile,
          uploaded: true,
          status: 'pending'
        };
      }
      return doc;
    });
    
    updateFormData({ documents: updatedDocuments });
    setDroppedFile(null);
    setShowDocumentSelector(false);
  };
  
  // Handle file drop cancellation
  const handleCancelDrop = () => {
    setDroppedFile(null);
    setShowDocumentSelector(false);
  };
  
  // Delete/remove a document
  const handleDeleteDocument = (docId: string, removeCompletely: boolean = false) => {
    // For required documents, just clear the file
    // For custom documents or when removeCompletely is true, remove the document entirely
    const doc = formData.documents.find(d => d.id === docId);
    
    if (!doc) return;
    
    if (removeCompletely) {
      // Remove the document entirely
      const updatedDocuments = formData.documents.filter(d => d.id !== docId);
      updateFormData({ documents: updatedDocuments });
    } else {
      // Just clear the file but keep the document type (for required documents)
      const updatedDocuments = formData.documents.map(d => {
        if (d.id === docId) {
          return {
            ...d,
            file: null,
            uploaded: false,
            status: 'not-uploaded'
          };
        }
        return d;
      });
      
      updateFormData({ documents: updatedDocuments });
    }
  };
  
  // View document (in this case just alert the filename since we can't actually view it)
  const handleViewDocument = (docId: string) => {
    const doc = formData.documents.find(d => d.id === docId);
    if (doc && doc.file) {
      alert(`Viewing document: ${doc.file.name}`);
      // In a real app, you would open a preview of the file
    }
  };
  
  // Handle adding a custom document
  const handleAddCustomDocument = (isNew: boolean = false) => {
    if (!customDocName.trim()) {
      alert('Please enter a document name');
      return;
    }
    
    // Generate a unique ID for the new document
    const newId = `custom-${Date.now()}`;
    
    const updatedDocuments = [
      ...formData.documents,
      {
        id: newId,
        name: customDocName,
        uploaded: false,
        status: 'not-uploaded',
        isCustom: true
      }
    ];
    
    updateFormData({ documents: updatedDocuments });
    setCustomDocName(''); // Reset the input field
  };
  
  // Handle initiating document deletion
  const initiateDeleteDocument = (docId: string) => {
    setDocumentToDelete(docId);
    setShowDeleteConfirmation(true);
  };
  
  // Handle confirming document deletion
  const confirmDeleteDocument = () => {
    if (documentToDelete) {
      handleDeleteDocument(documentToDelete, true);
      setDocumentToDelete(null);
      setShowDeleteConfirmation(false);
    }
  };
  
  // Handle canceling document deletion
  const cancelDeleteDocument = () => {
    setDocumentToDelete(null);
    setShowDeleteConfirmation(false);
  };
  
  return (
    <div>
      {/* Document Selector Dialog */}
      <Dialog open={showDocumentSelector} onOpenChange={setShowDocumentSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Document Type</DialogTitle>
            <DialogDescription>
              Choose which document you want to upload "{droppedFile?.name}" to:
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto">
            <div className="space-y-2 py-2">
              {formData.documents.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => handleAssignFileToDocument(doc.id)}
                  className={`p-3 rounded-md cursor-pointer flex items-center justify-between ${doc.uploaded ? 'bg-gray-100 text-gray-500' : 'hover:bg-indigo-50 border border-gray-200'}`}
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon 
                      icon={faFileLines} 
                      className={`${doc.isCustom ? "text-indigo-500" : "text-red-500"} mr-3 h-4 w-4`}
                    />
                    <div>
                      <div className="text-sm font-medium">
                        {doc.name}
                        {doc.isCustom && <span className="ml-2 text-xs text-indigo-600 font-normal">(Additional)</span>}
                      </div>
                      {doc.uploaded && (
                        <p className="text-xs text-gray-500">Already uploaded - will be replaced</p>
                      )}
                    </div>
                  </div>
                  {!doc.uploaded && (
                    <FontAwesomeIcon icon={faCheck} className="text-indigo-500 h-4 w-4 opacity-0 group-hover:opacity-100" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handleCancelDrop} className="cursor-pointer">
              Cancel
            </Button>
            <Button 
              onClick={() => handleAddCustomDocument(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              <FontAwesomeIcon icon={faFileLines} className="mr-2 h-4 w-4" /> Create New Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 mr-2 h-5 w-5" />
              Confirm Removal
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this document type from the list?
              {documentToDelete && formData.documents.find(d => d.id === documentToDelete)?.uploaded && (
                <p className="text-red-500 mt-2 text-sm">
                  Warning: This will also delete any uploaded file for this document.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between mt-4">
            <Button variant="outline" onClick={cancelDeleteDocument}>
              Cancel
            </Button>
            <Button 
              onClick={confirmDeleteDocument}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" /> 
              Remove Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Required Documents</h3>
      <p className="text-gray-600 mb-6">Upload all required documents for your license application:</p>
      
      <div className="mb-8">
        {/* Desktop Table View (hidden on mobile) */}
        <div className="hidden sm:block border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.documents.map((doc) => (
                <tr key={doc.id} className={doc.isCustom ? "bg-gray-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faFileLines} className={`${doc.isCustom ? "text-indigo-500" : "text-red-500"} mr-3 h-5 w-5`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {doc.name}
                          {doc.isCustom && <span className="ml-2 text-xs text-indigo-600 font-normal">(Additional)</span>}
                        </div>
                        {doc.file && (
                          <div className="text-xs text-gray-500">{doc.file.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.status === 'verified' && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        <FontAwesomeIcon icon={faCircleCheck} className="mr-1 h-3 w-3" /> Verified
                      </span>
                    )}
                    {doc.status === 'pending' && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        <FontAwesomeIcon icon={faClock} className="mr-1 h-3 w-3" /> Pending Verification
                      </span>
                    )}
                    {doc.status === 'not-uploaded' && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        <FontAwesomeIcon icon={faUpload} className="mr-1 h-3 w-3" /> Not Uploaded
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {doc.uploaded && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 !rounded-button whitespace-nowrap cursor-pointer"
                                  onClick={() => handleViewDocument(doc.id)}
                                >
                                  <FontAwesomeIcon icon={faEye} className="text-gray-500 h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Document</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 !rounded-button whitespace-nowrap cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faEllipsisVertical} className="text-gray-500 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {doc.uploaded ? (
                            <>
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (fileInputRef.current) {
                                    fileInputRef.current.click();
                                    fileInputRef.current.dataset.docId = doc.id;
                                  }
                                }}
                              >
                                <FontAwesomeIcon icon={faRotate} className="text-gray-500 mr-2 h-4 w-4" />
                                Replace Document
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteDocument(doc.id, false)}>
                                <FontAwesomeIcon icon={faTrash} className="text-gray-500 mr-2 h-4 w-4" />
                                Remove File
                              </DropdownMenuItem>
                              {doc.isCustom && (
                                <DropdownMenuItem 
                                  onClick={() => initiateDeleteDocument(doc.id)}
                                  className="text-red-600"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="text-red-500 mr-2 h-4 w-4" />
                                  Delete Document Type
                                </DropdownMenuItem>
                              )}
                            </>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => initiateDeleteDocument(doc.id)}
                              className={doc.isCustom ? "text-red-600" : "text-amber-600"}
                            >
                              <FontAwesomeIcon 
                                icon={faTrash} 
                                className={doc.isCustom ? "text-red-500 mr-2 h-4 w-4" : "text-amber-500 mr-2 h-4 w-4"} 
                              />
                              {doc.isCustom ? "Delete Document Type" : "Remove from List"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card View (shown only on mobile) */}
        <div className="sm:hidden space-y-3">
          {formData.documents.map((doc) => (
            <div key={doc.id} className={`border rounded-lg overflow-hidden p-3 ${doc.isCustom ? "bg-gray-50" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faFileLines} className={`${doc.isCustom ? "text-indigo-500" : "text-red-500"} mr-2 h-4 w-4`} />
                  <div className="text-sm font-medium text-gray-900">
                    {doc.name}
                    {doc.isCustom && <span className="ml-1 text-xs text-indigo-600 font-normal">(Additional)</span>}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 !rounded-button whitespace-nowrap cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faEllipsisVertical} className="text-gray-500 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {doc.uploaded ? (
                      <>
                        <DropdownMenuItem onClick={() => handleViewDocument(doc.id)}>
                          <FontAwesomeIcon icon={faEye} className="text-gray-500 mr-2 h-4 w-4" />
                          View Document
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.click();
                              fileInputRef.current.dataset.docId = doc.id;
                            }
                          }}
                        >
                          <FontAwesomeIcon icon={faRotate} className="text-gray-500 mr-2 h-4 w-4" />
                          Replace Document
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteDocument(doc.id, false)}>
                          <FontAwesomeIcon icon={faTrash} className="text-gray-500 mr-2 h-4 w-4" />
                          Remove File
                        </DropdownMenuItem>
                        {doc.isCustom && (
                          <DropdownMenuItem 
                            onClick={() => initiateDeleteDocument(doc.id)}
                            className="text-red-600"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-red-500 mr-2 h-4 w-4" />
                            Delete Document Type
                          </DropdownMenuItem>
                        )}
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem 
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.click();
                              fileInputRef.current.dataset.docId = doc.id;
                            }
                          }}
                        >
                          <FontAwesomeIcon icon={faUpload} className="text-gray-500 mr-2 h-4 w-4" />
                          Upload Document
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => initiateDeleteDocument(doc.id)}
                          className={doc.isCustom ? "text-red-600" : "text-amber-600"}
                        >
                          <FontAwesomeIcon 
                            icon={faTrash} 
                            className={doc.isCustom ? "text-red-500 mr-2 h-4 w-4" : "text-amber-500 mr-2 h-4 w-4"} 
                          />
                          {doc.isCustom ? "Delete Document Type" : "Remove from List"}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {doc.file && (
                <div className="text-xs text-gray-500 mb-2 pl-6">{doc.file.name}</div>
              )}
              
              <div className="flex justify-between items-center">
                <div>
                  {doc.status === 'verified' && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      <FontAwesomeIcon icon={faCircleCheck} className="mr-1 h-3 w-3" /> Verified
                    </span>
                  )}
                  {doc.status === 'pending' && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      <FontAwesomeIcon icon={faClock} className="mr-1 h-3 w-3" /> Pending Verification
                    </span>
                  )}
                  {doc.status === 'not-uploaded' && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      <FontAwesomeIcon icon={faUpload} className="mr-1 h-3 w-3" /> Not Uploaded
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Add custom document section */}
      <div className="mb-8">
        <h4 className="font-medium text-gray-800 mb-4">Add Additional Document</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Enter document name (e.g., Site Photos, Technical Report)"
              value={customDocName}
              onChange={(e) => setCustomDocName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
          <Button
            onClick={() => handleAddCustomDocument()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white !rounded-button whitespace-nowrap cursor-pointer"
          >
            <FontAwesomeIcon icon={faFileLines} className="mr-2 h-4 w-4" /> Add Document Name
          </Button>
        </div>
      </div>
      
      <div className="mb-8">
        <h4 className="font-medium text-gray-800 mb-4">Upload Document</h4>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.add('border-indigo-300', 'bg-indigo-50');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('border-indigo-300', 'bg-indigo-50');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('border-indigo-300', 'bg-indigo-50');
            
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files && files.length > 0) {
              // Set the dropped file and show the document selector
              setDroppedFile(files[0]);
              setShowDocumentSelector(true);
            }
          }}
        >
          <div className="space-y-4">
            <div className="mx-auto h-16 w-16 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
              <FontAwesomeIcon icon={faCloudArrowUp} className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Drag and drop your files here, or{" "}
                <span 
                  className="text-indigo-600 font-medium cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, JPG, PNG (Max size: 10MB)
              </p>
            </div>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white !rounded-button whitespace-nowrap cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FontAwesomeIcon icon={faFolderOpen} className="mr-2 h-4 w-4" /> Select Files
            </Button>
            
            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const docId = e.currentTarget.dataset.docId || null;
                handleFileUpload(e, docId);
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile-optimized navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-between sm:hidden">
        <div className="flex space-x-2">
          <Button
            onClick={() => window.location.href = '/'}
            variant="ghost"
            className="text-gray-500 !rounded-full h-10 w-10 p-0 flex items-center justify-center cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </Button>
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-gray-500 !rounded-full h-10 w-10 p-0 flex items-center justify-center cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium cursor-pointer"
        >
          Continue <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3 w-3" />
        </Button>
      </div>
      
      {/* Desktop navigation buttons */}
      <div className="hidden sm:flex justify-between mt-8">
        <div className="flex space-x-3">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="text-gray-700 !rounded-button whitespace-nowrap hover:bg-gray-100 border-gray-300 text-sm px-3 py-2 h-9 cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            className="!rounded-button whitespace-nowrap text-sm px-3 py-2 h-9 cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <Button
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-700 text-white !rounded-button whitespace-nowrap text-sm px-4 py-2 h-9 cursor-pointer"
        >
          Continue <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      {/* Spacer for mobile to prevent content from being hidden behind fixed buttons */}
      <div className="h-16 sm:hidden"></div>
    </div>
  );
};

export default DocumentUpload; 
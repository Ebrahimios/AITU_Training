import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const translations = {
  en: {
    // Navigation
    welcome_back: 'Welcome Back!',
    welcome_subtitle: 'Here\'s what\'s happening with your students today.',
    notifications: 'Notifications',
    clear_all: 'Clear all',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',

    // Dashboard
    dashboard: 'Dashboard',
    students_distribution: 'Students Distribution',
    supervisor_distribution: 'Supervisor Distribution',
    analytics: 'Analytics',
    total_students: 'Total Students',
    departments: 'Departments',
    active: 'Active',
    growth: 'Growth',

    // Table Headers
    student: 'Student',
    department: 'Department',
    factory: 'Factory',
    group: 'Group',
    stage: 'Stage',
    date: 'Date',
    supervisor: 'Supervisor',
    actions: 'Actions',

    // Filters and Sorting
    filters: 'Filters',
    sort: 'Sort',
    sort_by: 'Sort by',
    all: 'All',

    // Actions
    export: 'Export',
    add_student: 'Add Student',
    add_factory: 'Add Factory',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    accept: 'Accept',
    deny: 'Deny',

    // Statistics
    department_distribution: 'Department Distribution',

    // Pagination
    showing: 'Showing',
    to: 'to',
    of: 'of',
    entries: 'entries',
    per_page_5: '5 per page',
    per_page_10: '10 per page',
    per_page_20: '20 per page',

    // Factory and Student related
    back_to_home: 'Back to Home',
    batch: 'Batch',
    month: 'Month',
    year: 'Year',
    day: 'Day',
    reset: 'Reset',
    factory_name: 'Factory Name',
    address: 'Address',
    phone: 'Phone Number',
    contact_name: 'Contact Name',
    industry: 'Industry',
    capacity: 'Capacity',
    type: 'Type',
    select_all: 'Select All',
    students_selected: 'students selected',
    drag_students_here: 'Drag students here',
    factory_is_full: 'Factory is full',
    search_students: 'Search students...',
    search_factories: 'Search factories...',
    add_new_factory: 'Add New Factory',
    enter_factory_name: 'Enter factory name',
    enter_address: 'Enter address',
    enter_phone: 'Enter phone number',
    enter_contact_name: 'Enter contact person name',
    select_industry: 'Select industry',
    enter_capacity: 'Enter capacity',
    select_type: 'Select type',
    factory_details: 'Factory Details',
    name: 'Name',
    assigned_students: 'Assigned Students',
    students: 'Students',
    factories: 'Factories',
    
    // Notifications
    new_factory_added: 'New factory added by student',
    new_student_registered: 'New student registered',
    factory_capacity_updated: 'Factory capacity updated',
    view_details: 'View Details',
    
    // Validation messages
    required_field: 'This field is required',
    invalid_phone: 'Invalid phone number format',
    invalid_capacity: 'Capacity must be a positive number',
    
    // Comparison
    vs: 'vs'
  },
  ar: {
    // Navigation
    welcome_back: 'مرحباً بعودتك!',
    welcome_subtitle: 'إليك ما يحدث مع طلابك اليوم.',
    notifications: 'الإشعارات',
    clear_all: 'مسح الكل',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',

    // Dashboard
    dashboard: 'لوحة التحكم',
    students_distribution: 'توزيع الطلاب',
    supervisor_distribution: 'توزيع المشرفين',
    analytics: 'التحليلات',
    total_students: 'إجمالي الطلاب',
    departments: 'الأقسام',
    active: 'نشط',
    growth: 'النمو',

    // Table Headers
    student: 'الطالب',
    department: 'القسم',
    factory: 'المصنع',
    group: 'المجموعة',
    stage: 'المرحلة',
    date: 'التاريخ',
    supervisor: 'المشرف',
    actions: 'الإجراءات',

    // Filters and Sorting
    filters: 'التصفية',
    sort: 'ترتيب',
    sort_by: 'ترتيب حسب',
    all: 'الكل',

    // Actions
    export: 'تصدير',
    add_student: 'إضافة طالب',
    add_factory: 'إضافة مصنع',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    accept: 'قبول',
    deny: 'رفض',

    // Statistics
    department_distribution: 'توزيع الأقسام',

    // Pagination
    showing: 'عرض',
    to: 'إلى',
    of: 'من',
    entries: 'سجل',
    per_page_5: '5 لكل صفحة',
    per_page_10: '10 لكل صفحة',
    per_page_20: '20 لكل صفحة',

    // Factory and Student related
    back_to_home: 'العودة للرئيسية',
    batch: 'دفعة',
    month: 'شهر',
    year: 'سنة',
    day: 'يوم',
    reset: 'إعادة تعيين',
    factory_name: 'اسم المصنع',
    address: 'العنوان',
    phone: 'رقم الهاتف',
    contact_name: 'اسم جهة الاتصال',
    industry: 'الصناعة',
    capacity: 'السعة',
    type: 'النوع',
    select_all: 'تحديد الكل',
    students_selected: 'طالب محدد',
    drag_students_here: 'اسحب الطلاب هنا',
    factory_is_full: 'المصنع ممتلئ',
    search_students: 'البحث عن طلاب...',
    search_factories: 'البحث عن مصانع...',
    add_new_factory: 'إضافة مصنع جديد',
    enter_factory_name: 'أدخل اسم المصنع',
    enter_address: 'أدخل العنوان',
    enter_phone: 'أدخل رقم الهاتف',
    enter_contact_name: 'أدخل اسم جهة الاتصال',
    select_industry: 'اختر الصناعة',
    enter_capacity: 'أدخل السعة',
    select_type: 'اختر النوع',
    factory_details: 'تفاصيل المصنع',
    name: 'الاسم',
    assigned_students: 'الطلاب المعينين',
    students: 'الطلاب',
    factories: 'المصانع',
    
    // Notifications
    new_factory_added: 'تمت إضافة مصنع جديد بواسطة طالب',
    new_student_registered: 'تم تسجيل طالب جديد',
    factory_capacity_updated: 'تم تحديث سعة المصنع',
    view_details: 'عرض التفاصيل',
    
    // Validation messages
    required_field: 'هذا الحقل مطلوب',
    invalid_phone: 'صيغة رقم الهاتف غير صحيحة',
    invalid_capacity: 'يجب أن تكون السعة رقمًا موجبًا',
    
    // Comparison
    vs: 'مقابل'
  }
} as const;

// Create a type that represents all possible translation keys
type TranslationKeys = keyof typeof translations.en;

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLang = new BehaviorSubject<'en' | 'ar'>('en');
  currentLang$ = this.currentLang.asObservable();

  constructor() {
    // Check if language preference exists in localStorage
    const savedLang = localStorage.getItem('preferredLanguage') as 'en' | 'ar' | null;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      this.setLanguage(savedLang);
    }
  }

  setLanguage(lang: 'en' | 'ar') {
    this.currentLang.next(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    // Save language preference to localStorage
    localStorage.setItem('preferredLanguage', lang);
  }

  translate(key: TranslationKeys): string {
    const currentLang = this.currentLang.value;
    // Check if the key exists in the current language
    if (translations[currentLang][key]) {
      return translations[currentLang][key];
    }
    // Fallback to English if the key doesn't exist in the current language
    if (translations.en[key]) {
      return translations.en[key];
    }
    // Return the key itself if it doesn't exist in any language
    return key;
  }
  
  // Helper method to get current language
  getCurrentLanguage(): 'en' | 'ar' {
    return this.currentLang.value;
  }
  
  // Helper method to check if current language is RTL
  isRtl(): boolean {
    return this.currentLang.value === 'ar';
  }
}

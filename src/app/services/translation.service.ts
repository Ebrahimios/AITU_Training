import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const translations: Record<'en' | 'ar', Record<string, string>> = {
  en: {
    // Navigation
    welcome_back: 'Welcome Back!',
    welcome_subtitle: "Here's what's happening with your students today.",
    notifications: 'Notifications',
    clear_all: 'Clear all',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    import_csv: 'Import CSV',
    // Dashboard
    dashboard: 'Dashboard',
    students_distribution: 'Students Distribution',
    supervisor_distribution: 'Supervisor Distribution',
    analytics: 'Analytics',
    total_students: 'Total Students',
    departments: 'Departments',
    supervisors: 'Supervisors',
    active: 'Active',
    growth: 'Growth',

    attendance:"attendance",

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
    filter_by_department: 'Department',
    filter_by_stage: 'Stage',
    filter_by_batch: 'Batch',
    filter_by_factory_type: 'Factory Type',

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
    email: 'Email',
    role: 'Role',
    lastUpdated: 'Last Updated',
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
    factory_name_required: 'Factory name must be at least 3 characters long',
    address_required: 'Address must be at least 5 characters long',
    phone_validation_error: 'Phone number must be exactly 11 or 15 digits',
    contact_name_required: 'Contact name must be at least 3 characters long',
    industry_required: 'Please select an industry',
    capacity_required: 'Capacity must be greater than 0',
    type_required: 'Please select a factory type',
    coordinates_validation_error:
      'Invalid coordinates format. Please use format: latitude, longitude',

    //departments
    electrical: 'Electrical',
    mechanics: 'Mechanics',
    information_technology: 'Information Technology',
    // Comparison
    vs: 'vs',

    // Batch names
    batch_1: 'Batch 1',
    batch_2: 'Batch 2',
    batch_3: 'Batch 3',
    batch_4: 'Batch 4',

    // Stage names
    school: 'School',
    institute: 'Institute',
    faculty: 'Faculty',

    // Month names
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',

    // Sort options
    name_asc: 'Name (A-Z)',
    name_desc: 'Name (Z-A)',
    date_new: 'Newest First',
    date_old: 'Oldest First',

    // Student Distribution Component - New Keys Only
    no_students_assigned: 'No students assigned',
    save_changes: 'Save Changes',
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
    import_csv: 'Import CSV',

    attendance:"حالة الحضوؤ",

    // Dashboard
    dashboard: 'لوحة التحكم',
    students_distribution: 'توزيع الطلاب',
    supervisor_distribution: 'توزيع المشرفين',
    analytics: 'التحليلات',
    total_students: 'إجمالي الطلاب',
    departments: 'الأقسام',
    supervisors: 'المشرفين',
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
    filter_by_department: 'القسم',
    filter_by_stage: 'المرحلة',
    filter_by_batch: 'الدفعة',
    filter_by_factory_type: 'نوع المصنع',

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
    email: 'البريد الإلكتروني',
    role: 'الدور',
    lastUpdated: 'آخر تحديث',
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
    factory_name_required: 'يجب أن يكون اسم المصنع 3 أحرف على الأقل',
    address_required: 'يجب أن يكون العنوان 5 أحرف على الأقل',
    phone_validation_error: 'يجب أن يكون رقم الهاتف 11 أو 15 رقمًا بالضبط',
    contact_name_required: 'يجب أن يكون اسم جهة الاتصال 3 أحرف على الأقل',
    industry_required: 'الرجاء اختيار الصناعة',
    capacity_required: 'يجب أن تكون السعة أكبر من 0',
    type_required: 'الرجاء اختيار نوع المصنع',
    coordinates_validation_error:
      'صيغة الإحداثيات غير صحيحة. الرجاء استخدام الصيغة: خط العرض، خط الطول',

    //departments
    electrical: 'كهرباء',
    mechanics: 'ميكانيكا',
    information_technology: 'تكنولوجيا المعلومات',

    // Batch names
    batch_1: 'دفعة 1',
    batch_2: 'دفعة 2',
    batch_3: 'دفعة 3',
    batch_4: 'دفعة 4',

    // Stage names
    school: 'مدرسة',
    institute: 'معهد',
    faculty: 'كلية',

    // Month names
    january: 'يناير',
    february: 'فبراير',
    march: 'مارس',
    april: 'أبريل',
    may: 'مايو',
    june: 'يونيو',
    july: 'يوليو',
    august: 'أغسطس',
    september: 'سبتمبر',
    october: 'أكتوبر',
    november: 'نوفمبر',
    december: 'ديسمبر',

    // Sort options
    name_asc: 'الاسم (أ-ي)',
    name_desc: 'الاسم (ي-أ)',
    date_new: 'الأحدث أولاً',
    date_old: 'الأقدم أولاً',

    // Student Distribution Component - New Keys Only
    no_students_assigned: 'لا يوجد طلاب معينين',
    save_changes: 'حفظ التغييرات',
  },
} as const;

// Create a type that represents all possible translation keys
type TranslationKeys = keyof typeof translations.en &
  keyof typeof translations.ar;

// Export the type for use in components
export type { TranslationKeys };

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private currentLang = new BehaviorSubject<'en' | 'ar'>('en');
  currentLang$ = this.currentLang.asObservable();

  constructor() {
    // Check if language preference exists in localStorage
    const savedLang = localStorage.getItem('preferredLanguage') as
      | 'en'
      | 'ar'
      | null;
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
    const translation = translations[currentLang][key];

    if (!translation) {
      console.warn(
        `Translation key '${key}' not found in ${currentLang} language`,
      );
      // Fallback to English if the key doesn't exist in the current language
      const englishTranslation = translations.en[key];
      if (!englishTranslation) {
        console.error(
          `Translation key '${key}' not found in both ${currentLang} and English`,
        );
        return `Missing translation: ${key}`;
      }
      return englishTranslation;
    }
    return translation;
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

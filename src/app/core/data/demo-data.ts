import { Competition, EventState } from "../models/event.models";

const cats = (...n: number[]) => n.map((v) => `cat-${v}`);

export function createDemoState(): EventState {
  const categories = [
    ["I", 48, 72], ["II", 72, 84], ["III", 84, 96], ["IV", 96, 108],
    ["V", 108, 120], ["VI", 120, 132], ["VII", 132, 144], ["VIII", 144, 156],
    ["IX", 156, 168], ["X", 168, 180], ["XI", 180, 192], ["XII", 192, 204],
  ].map(([roman, min, max]) => ({
    id: `cat-${["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"].indexOf(String(roman)) + 1}`,
    name: `Category ${roman}`,
    nameTa: `வயதுப் பிரிவு ${roman}`,
    minMonths: Number(min),
    maxMonths: Number(max),
  }));

  const base = (
    id: string,
    name: string,
    tamil: string,
    kind: Competition["kind"],
    categoryIds: string[],
    language: string,
    image: string,
    instructions: string,
    instructionsTa = "போட்டிக்கான தேவையான பொருட்களுடன் நேரத்திற்கு முன் வரவும்.",
  ): Competition => ({
    id, name, tamil, kind, categoryIds, language, image, instructions, instructionsTa,
    fee: 0,
    slotId: "slot-1",
    capacity: 200,
    status: "Open",
  });

  const competitions: Competition[] = [
    base("handwriting", "Handwriting", "கையெழுத்துப் போட்டி", "Writing", cats(1,2,3,4,5,6,7,8), "English", "/images/writing-oratory.png", "English handwriting competition."),
    base("oratory", "Oratory", "பேச்சுப் போட்டி", "Speaking", cats(1,2,3,4,5,6,7,8,9,10,11,12), "Tamil or English", "/images/cultural-stage.png", "Oratory in Tamil or English."),
    base("colouring", "Colouring", "வண்ணம் தீட்டுதல்", "Art", cats(1,2), "Not applicable", "/images/art-kids.png", "Colouring competition."),
    base("clay-2d", "2D Clay Art", "2D களிமண் கலை", "Art", cats(1,2,3), "Not applicable", "/images/art-kids.png", "Create a 2D clay artwork."),
    base("pencil-2d", "2D Pencil Drawing", "2D பென்சில் ஓவியம்", "Art", cats(3,4,5), "Not applicable", "/images/art-kids.png", "2D pencil drawing competition."),
    base("pot-painting", "Pot Painting", "பானை ஓவியம்", "Art", cats(4,5), "Not applicable", "/images/art-kids.png", "Pot painting competition."),
    base("essay", "Essay Writing", "கட்டுரைப் போட்டி", "Writing", cats(6,7,8,9,10,11,12), "Tamil or English", "/images/writing-oratory.png", "Topic: Different Art Forms in India."),
    base("floral-kolam", "Floral Kolam Making", "பூக்கோலம்", "Art", cats(6), "Not applicable", "/images/folk-art-frame.png", "Floral kolam making."),
    base("kambi-kolam", "Kambi Kolam Making", "கம்பிக் கோலம்", "Art", cats(7), "Not applicable", "/images/folk-art-frame.png", "Kambi kolam making."),
    base("mandala", "Mandala Art", "மண்டலா கலை", "Art", cats(8), "Not applicable", "/images/folk-art-frame.png", "Mandala art competition."),
    base("pencil-3d", "3D Pencil Shading", "3D பென்சில் நிழலோவியம்", "Art", cats(6,7,8), "Not applicable", "/images/art-kids.png", "3D pencil shading competition."),
    base("quiz", "Quiz – Indian Fine Arts", "வினாடி வினா – இந்திய நுண்கலைகள்", "Quiz", cats(9,10,11,12), "Not applicable", "/images/quiz-arts.png", "Quiz topic: Indian Fine Arts."),
    base("warli", "Warli Art", "வார்லி கலை", "Art", cats(9), "Not applicable", "/images/folk-art-frame.png", "Warli art competition."),
    base("gond", "Gond Art", "கோண்ட் கலை", "Art", cats(10), "Not applicable", "/images/folk-art-frame.png", "Gond art competition."),
    base("madhubani", "Madhubani Art", "மதுபானி கலை", "Art", cats(11), "Not applicable", "/images/folk-art-frame.png", "Madhubani art competition."),
    base("kalamkari", "Kalamkari Art", "கலம்காரி கலை", "Art", cats(12), "Not applicable", "/images/folk-art-frame.png", "Kalamkari art competition."),
    base("modern", "Modern Art", "நவீன ஓவியம்", "Art", cats(9,10,11,12), "Not applicable", "/images/art-kids.png", "Modern art competition."),
  ];

  return {
    categories,
    slots: [{ id: "slot-1", name: "Main Event Slot", date: "", start: "", end: "", venue: "" }],
    competitions,
    registrations: [],
    judges: [],
    scores: [],
    settings: {
      title: "Chithiram Thiruvila",
      titleTa: "சித்திரம் திருவிழா",
      presenters: "SBK VIBGYOR School & Star Guru Charitable Foundation",
      date: "",
      venue: "",
      registrationDeadline: "",
      maxEvents: 2,
      registrationOpen: true,
      prefix: "26SBK",
      contact: "",
      email: "",
      instructionsEn: "Carry the approved participant pass to the event. Reach the venue at least 30 minutes before your first competition. Bring only the materials permitted by the organiser.",
      instructionsTa: "அங்கீகரிக்கப்பட்ட பங்கேற்பாளர் பாஸை நிகழ்விற்கு கொண்டு வரவும். முதல் போட்டிக்கு குறைந்தது 30 நிமிடங்களுக்கு முன் வரவும். ஏற்பாட்டாளர் அனுமதித்த பொருட்களை மட்டும் கொண்டு வரவும்.",
      termsEn: "The date of birth entered must be correct. Age category is calculated from the application date. A participant may select a maximum of two eligible competitions. Online registrations require online payment. Registration is valid for event entry only after organiser approval.",
      termsTa: "பிறந்த தேதி சரியாக இருக்க வேண்டும். விண்ணப்ப தேதியின் அடிப்படையில் வயது பிரிவு கணக்கிடப்படும். அதிகபட்சம் இரண்டு தகுதியான போட்டிகளை மட்டும் தேர்வு செய்யலாம். ஆன்லைன் பதிவுக்கு ஆன்லைன் கட்டணம் அவசியம். ஏற்பாட்டாளர் அங்கீகாரத்திற்கு பிறகே பதிவு நிகழ்வு நுழைவுக்கு செல்லுபடியாகும்.",
      bannerImage: "/images/festival-main.png",
    },
  };
}

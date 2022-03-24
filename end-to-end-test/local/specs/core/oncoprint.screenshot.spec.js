var {
    goToUrlAndSetLocalStorage,
    waitForOncoprint,
    checkOncoprintElement,
    goToUrlAndSetLocalStorageWithProperty, setDropdownOpen,
} = require('../../../shared/specUtils');
const {getNthTrackOptionsElements} = require("../../../shared/lib/testUtils");
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const studyes0_oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint' +
    '?Action=Submit' +
    '&RPPA_SCORE_THRESHOLD=2.0' +
    '&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=study_es_0' +
    '&case_set_id=study_es_0_all' +
    '&data_priority=0' +
    '&gene_list=ABLIM1%250ATMEM247' +
    '&geneset_list=%20' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations' +
    '&profileFilter=0' +
    '&tab_index=tab_visualize';

const DEFAULT_TRACK_CONFIG = [
    {
        stableId: 'SUBTYPE',
        sortOrder: 'ASC',
        gapOn: true,
    },
    {
        stableId: 'OS_STATUS',
        sortOrder: 'DESC',
        gapOn: false,
    },
    {
        stableId: 'DFS_STATUS',
        sortOrder: null,
        gapOn: null,
    },
];

const USER_TRACK_CONFIG = [
    {
        stableId: 'SUBTYPE',
        sortOrder: 'ASC',
        gapOn: false,
    },
    {
        stableId: 'OS_STATUS',
        sortOrder: 'ASC',
        gapOn: false,
    },
    {
        stableId: 'DFS_STATUS',
        sortOrder: 'ASC',
        gapOn: true,
    },
];

const ONCOPRINT_TIMEOUT = 60000;

describe('oncoprint', function () {
    describe('generic assay categorical tracks', () => {
        it('shows binary and multiple category tracks', () => {
            const url = `${CBIOPORTAL_URL}/results/oncoprint?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=IDH1&geneset_list=%20&tab_index=tab_visualize&Action=Submit&show_samples=true&generic_assay_groups=lgg_ucsf_2014_test_generic_assay_mutational_signature_binary_v2%2Cmutational_signature_binary_2%2Cmutational_signature_binary_1%3Blgg_ucsf_2014_test_generic_assay_mutational_signature_category_v2%2Cmutational_signature_category_6%2Cmutational_signature_category_8%2Cmutational_signature_category_9`;
            goToUrlAndSetLocalStorage(url, true);
            waitForOncoprint(ONCOPRINT_TIMEOUT);
            const res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });
    });

    describe('clinical tracks', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorageWithProperty(studyes0_oncoprintTabUrl, true, {
                oncoprint_clinical_tracks_show_by_default: JSON.stringify(
                    DEFAULT_TRACK_CONFIG
                ),
            });
            waitForOncoprint(ONCOPRINT_TIMEOUT);
        });

        it('initializes as configured by default', () => {
            const res = checkOncoprintElement('.oncoprintContainer');
            assertScreenShotMatch(res);
        });

        it('stores configuration in url param "clinicallist" during initialization', () => {
            const url = browser.getUrl();
            const clinicalList = new URLSearchParams(url).get('clinicallist');
            expect(clinicalList).toEqual(JSON.stringify(DEFAULT_TRACK_CONFIG));
        });

        it('updates url when changing gaps', () => {
            const firstTrack = getNthTrackOptionsElements(1);
            $(firstTrack.button_selector).click();
            $(firstTrack.dropdown_selector).waitForDisplayed({
                timeout: 1000,
            });
            $("li=Don't show gaps").click();
            waitForOncoprint(2000);

            const url = browser.getUrl();
            const clinicalTracksUrlParam = new URLSearchParams(url).get(
                'clinicallist'
            );
            expect(DEFAULT_TRACK_CONFIG[0].gapOn === true);
            const updatedTrackConfig = JSON.parse(
                JSON.stringify(DEFAULT_TRACK_CONFIG)
            );
            updatedTrackConfig[0].gapOn = false;
            expect(clinicalTracksUrlParam).toEqual(
                JSON.stringify(updatedTrackConfig)
            );

        });

        it('updates url when sorting', () => {
            const firstTrack = getNthTrackOptionsElements(1);
            $(firstTrack.button_selector).click();
            $(firstTrack.dropdown_selector).waitForDisplayed({
                timeout: 1000,
            });
            $("li=Sort Z-a").click();
            waitForOncoprint(2000);

            const url = browser.getUrl();
            const clinicalTracksUrlParam = new URLSearchParams(url).get(
                'clinicallist'
            );
            expect(DEFAULT_TRACK_CONFIG[0].sortOrder === 'ASC');
            const updatedTrackConfig = JSON.parse(
                JSON.stringify(DEFAULT_TRACK_CONFIG)
            );
            updatedTrackConfig[0].sortOrder = 'DESC';
            expect(clinicalTracksUrlParam).toEqual(
                JSON.stringify(updatedTrackConfig)
            );
        });

        it('initializes correctly when "clinicallist" config present in url', () => {
            const urlConfig = encodeURIComponent(JSON.stringify(USER_TRACK_CONFIG));
            const urlWithUserConfig = `${studyes0_oncoprintTabUrl}&clinicallist=${urlConfig}`;
            goToUrlAndSetLocalStorage(urlWithUserConfig, false);
            waitForOncoprint(ONCOPRINT_TIMEOUT);

            const url = browser.getUrl();
            const clinicalList = new URLSearchParams(url).get('clinicallist');
            expect(clinicalList).toEqual(JSON.stringify(USER_TRACK_CONFIG));
            const res = checkOncoprintElement('.oncoprintContainer');
            assertScreenShotMatch(res);
        });

        it('still supports legacy "clinicallist" format', () => {
            // Create oncoprint from legacy format:
            const legacyFormat = USER_TRACK_CONFIG.map(track => track.stableId).join(',');
            const legacyUrl = `${studyes0_oncoprintTabUrl}&clinicallist=${legacyFormat}`;
            goToUrlAndSetLocalStorage(legacyUrl, false);
            waitForOncoprint(ONCOPRINT_TIMEOUT);

            // Modify oncoprint with legacy format:
            const firstTrack = getNthTrackOptionsElements(1);
            $(firstTrack.button_selector).click();
            $(firstTrack.dropdown_selector).waitForDisplayed({
                timeout: 1000,
            });
            $("li=Sort a-Z").click();
            waitForOncoprint(2000);

            // Legacy format should be converted to config json:
            const url = browser.getUrl();
            const clinicalList = JSON.parse(decodeURIComponent(
                new URLSearchParams(url).get('clinicallist')
            ));
            const stableIds = clinicalList.map(tracks => tracks.stableId);
            expect(stableIds.join(',')).toEqual(legacyFormat);
            expect(clinicalList[0].sortOrder).toEqual('ASC');
            const res = checkOncoprintElement('.oncoprintContainer');
            assertScreenShotMatch(res);
        });
    });
});

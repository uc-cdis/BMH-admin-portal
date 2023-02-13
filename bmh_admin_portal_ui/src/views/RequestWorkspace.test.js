import {
    mount
} from 'enzyme';
import {
    waitFor
} from '@testing-library/react';
import RequestWorkspace from './request-workspace';
import * as authUtils from '../util/auth';
import {
    act
} from 'react-dom/test-utils';


process.env.REACT_APP_OIDC_AUTH_URI = "https://fence.planx-pla.net/user/oauth2/authorize"
const FORM_TYPES = {
    stridesGrant: "strides-grant",
    stridesCredits: "strides-credits"
};
const DEFAULT_FORM_TYPE = FORM_TYPES.stridesGrant;

const FORM_TAGS = {
    "strides-grant": "StridesGrantForm",
    "strides-credits": "StridesCreditForm"
};

const getRenderedFormTypesList = (wrapperTag) => {
    let renderedFormTypes = [];
    for (let formType in FORM_TAGS) {
        if (wrapperTag.find(FORM_TAGS[formType]).length) { //length returns zero for a missing form_type
            renderedFormTypes.push(formType)
        }
    }
    return renderedFormTypes;
}

const mountRequestWorkspceWrapper = (isCreditsAuthorized = false) => {
    jest.spyOn(authUtils, 'authorizeCredits').mockResolvedValue(isCreditsAuthorized);
    return mount( <RequestWorkspace/> );
}

it('renders RequestWorkspace page with default form', async () => {
    const requestWorkspaceWrapper = mountRequestWorkspceWrapper(false);
    requestWorkspaceWrapper.update();
    expect(requestWorkspaceWrapper.find('h2').text()).toBe("Workspace Account Request Form");
    expect(requestWorkspaceWrapper.find(FORM_TAGS[DEFAULT_FORM_TYPE])).toHaveLength(1);
});

describe('verify the form toggles are working as expected', () => {

    it('verifies the number of toggle buttons rendered correctly for all form types', async () => {
        const requestWorkspaceWrapper = mountRequestWorkspceWrapper(true);

        await waitFor(() => {});

        //Update the wrapper body after async operations are performed
        requestWorkspaceWrapper.update();

        expect(requestWorkspaceWrapper.find('ToggleButton')).toHaveLength(Object.keys(FORM_TYPES).length);
        for (let type in FORM_TYPES) {
            expect(requestWorkspaceWrapper.find('ToggleButton').filter({
                "value": FORM_TYPES[type]
            })).toHaveLength(1);
        }
    });


    it('verifies RequestWorkspace toggles between forms', async () => {
        const requestWorkspaceWrapper = mountRequestWorkspceWrapper(true);

        //Ensure default form is being loaded at first
        expect(getRenderedFormTypesList(requestWorkspaceWrapper)).toEqual([DEFAULT_FORM_TYPE]);

        await waitFor(() => {});
        //Update the wrapper body after async operations are performed
        requestWorkspaceWrapper.update();

        let handleChange = requestWorkspaceWrapper.find('ForwardRef').prop('onChange');

        for (let type in FORM_TYPES) {
            act(() => {
                handleChange(FORM_TYPES[type]);
            }); //When testing, code that causes React state updates should be wrapped into act(...)
            requestWorkspaceWrapper.update();
            expect(getRenderedFormTypesList(requestWorkspaceWrapper)).toEqual([FORM_TYPES[type]]);
        }
    });

});

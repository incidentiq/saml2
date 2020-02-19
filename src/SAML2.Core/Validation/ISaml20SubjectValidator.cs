using SAML2.Schema.Core;

namespace SAML2.Validation
{
    /// <summary>
    /// SAML2 Subject Validator interface.
    /// </summary>
    public interface ISaml20SubjectValidator
    {
        /// <summary>
        /// Validates the subject.
        /// </summary>
        /// <param name="subject">The subject.</param>
        /// <param name="ignoreNameIdLengthRequirement">Ignore name ID minimum length.</param>
        void ValidateSubject(Subject subject, bool ignoreNameIdLengthRequirement);
    }
}
